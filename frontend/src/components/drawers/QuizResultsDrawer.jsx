import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {Search, Trophy} from "lucide-react";

import Button from "../ui/Button";
import { DrawerHeader, DrawerFooter } from "../../context/drawer/DrawerProvider";
import LeaderboardTable from "../leaderboard/LeaderboardTable.jsx";
import Input from "../ui/Input";

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${String(mm).padStart(2, "0")}m`;
  }
  return `${m}m ${String(r).padStart(2, "0")}s`;
}

export const QuizResultsDrawer = ({ closeDrawer, quiz, id_user, hideHeader = false }) => {
	const { t } = useTranslation();

	const [loading, setLoading] = useState(false);

	const [results, setResults] = useState([]);

	const [searchText, setSearchText] = useState("");
	const [sortColumn, setSortColumn] = useState("rank");
	const [sortAsc, setSortAsc] = useState(true);

	const isGlobalMode = Array.isArray(quiz?.results);

	useEffect(() => {
		if (!quiz?.id) {
			setResults([]);
			setLoading(false);
			return;
		}

		if (isGlobalMode) {
			setResults(quiz.results);
			setLoading(false);
			return;
		}

		if (!id_user) {
			setResults([]);
			setLoading(false);
			return;
		}

		(async () => {
			try {
				setLoading(true);
				const res = await fetch(
				`${import.meta.env.VITE_API_URL}/api/users/${id_user}/quizzes/${quiz.id}/results?lang=fr`
				);
				if (!res.ok) throw new Error("Failed to load quiz results");
				const data = await res.json();

				const attempts = Array.isArray(data.attempts) ? data.attempts : [];

				const sorted = [...attempts].sort((a, b) => {
				const sa = Number(a.score ?? 0);
				const sb = Number(b.score ?? 0);
				if (sb !== sa) return sb - sa;

				const ta = Number(a.time_taken ?? 0);
				const tb = Number(b.time_taken ?? 0);
				return ta - tb;
				});

				const mapped = sorted.map((a, idx) => ({
				rank: idx + 1,
				score: Number(a.score ?? 0),
				time_seconds: Number(a.time_taken ?? 0),
				_raw: a,
				}));

				setResults(mapped);
			} catch (e) {
				console.error(e);
				setResults([]);
			} finally {
				setLoading(false);
			}
		})();
	}, [quiz?.id, id_user, isGlobalMode, quiz?.results]);


	if (!quiz) {
		return (
			<Container>
				{!hideHeader && (
					<DrawerHeader
						title={t("leaderboard.quizResults") ?? "Résultats du quiz"}
						onClose={closeDrawer}
						icon={<Trophy size={20} />}
					/>
				)}
				<Content>
					<EmptyState>{t("leaderboard.noQuizSelected") ?? "Aucun quiz sélectionné."}</EmptyState>
				</Content>
				<DrawerFooter>
					<Button variant="ghost" onClick={closeDrawer}>
						{t("common.close")}
					</Button>
				</DrawerFooter>
			</Container>
		);
	}

	const columns = isGlobalMode
		? [
			{ key: "rank", label: t("leaderboard.rank"), align: "center", width: "100px" },
			{ key: "user_name", label: t("leaderboard.name"), align: "left", width: "2fr" },
			{ key: "score", label: t("leaderboard.score"), align: "right", width: "1fr" },
			{ key: "time_seconds", label: t("leaderboard.best_time"), align: "right", width: "1fr" },
			{ key: "attempts", label: t("leaderboard.attempts"), align: "right", width: "1fr" },
		]
		: [
			{ key: "rank", label: t("leaderboard.rank") ?? "Rang", align: "center", width: "100px" },
			{ key: "score", label: t("leaderboard.score") ?? "Score", align: "right", width: "1fr" },
			{ key: "time_seconds", label: t("leaderboard.time") ?? "Temps", align: "right", width: "1fr" },
		];

	const entries = useMemo(() => {
		let list = Array.isArray(results) ? [...results] : [];

		const text = searchText.trim().toLowerCase();
		if (text) {
		list = list.filter((row) => {
			const rank = String(row.rank ?? "");
			const score = String(row.score ?? "");
			const time = String(row.time_seconds ?? "");
			const timeFmt = formatTime(row.time_seconds ?? 0).toLowerCase();

			if (isGlobalMode) {
			const name = String(row.user_name ?? "").toLowerCase();
			const attempts = String(row.attempts ?? "");
			return (
				rank.includes(text) ||
				score.includes(text) ||
				time.includes(text) ||
				timeFmt.includes(text) ||
				name.includes(text) ||
				attempts.includes(text)
			);
			}

			return rank.includes(text) || score.includes(text) || time.includes(text) || timeFmt.includes(text);
		});
		}

		list.sort((a, b) => {
		const valA = a?.[sortColumn];
		const valB = b?.[sortColumn];

		if (valA == null) return 1;
		if (valB == null) return -1;

		if (typeof valA === "string") {
			return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
		}
		return sortAsc ? valA - valB : valB - valA;
		});

		if (isGlobalMode && !text) return list.slice(0, 10);
		return list;
	}, [results, searchText, sortColumn, sortAsc, isGlobalMode]);

	const totalCount = Array.isArray(results) ? results.length : 0;


	return (
		<Container>
			{!hideHeader && (
				<DrawerHeader
					title={quiz.title}
					onClose={closeDrawer}
					icon={<Trophy size={20} />}
					subtitle={
						isGlobalMode
						? (t("leaderboard.title", { owner: quiz.owner ?? "", count: totalCount }) ||
							`${quiz.owner ?? ""} • ${totalCount} participants`)
						: (t("profile.myResultsForQuiz") ?? "Mes résultats pour ce quiz")
					}
				/>
			)}

			<Content>
				<Input
					type="text"
					placeholder={isGlobalMode ? t("leaderboard.searchPlaceholder") : (t("profile.searchResult") ?? "Rechercher un résultat")}
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					icon={<Search size={20} color={"var(--color-text-muted)"} />}
					size="m"
					width="100%"
				/>

				<LeaderboardTable
					columns={columns}
					entries={entries}
					loading={loading}
					sortColumn={sortColumn}
					sortAsc={sortAsc}
					onSortChange={(col, asc) => {
						setSortColumn(col);
						setSortAsc(asc);
					}}
					sortableColumns={
						isGlobalMode
							? ["rank", "user_name", "score", "time_seconds", "attempts"]
							: ["rank", "score", "time_seconds"]
					}
				/>

				{!loading && totalCount === 0 && (
					<EmptyState>{t("leaderboard.noResults") ?? "Aucun résultat trouvé."}</EmptyState>
				)}
			</Content>

			<DrawerFooter>
				<Button variant="secondary" onClick={closeDrawer}>
					{t("common.actions.close")}
				</Button>
			</DrawerFooter>
		</Container>
	);
};


const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: var(--spacing-12xl);
`;

const Content = styled.div`
	flex: 1;
	padding: var(--spacing);
	display: flex;
	flex-direction: column;
	gap: var(--spacing);
	overflow-y: auto;
`;

const EmptyState = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-text-muted);
	font-size: var(--font-size);
	text-align: center;
	padding: var(--spacing);
`;
