// src/drawers/QuizResultsDrawer.jsx
import { useState, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";

import Button from "../ui/Button";
import { DrawerHeader, DrawerFooter } from "../../context/drawer/DrawerProvider";
import LeaderboardTable from "../leaderboard/LeaderboardTable.jsx";

export const QuizResultsDrawer = ({ closeDrawer, quiz, hideHeader = false }) => {
	const { t } = useTranslation();

	const [searchText, setSearchText] = useState("");
	const [sortColumn, setSortColumn] = useState("rank");
	const [sortAsc, setSortAsc] = useState(true);

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
					<EmptyState>
						{t("leaderboard.noQuizSelected") ?? "Aucun quiz sélectionné."}
					</EmptyState>
				</Content>
				<DrawerFooter>
					<Button variant="ghost" onClick={closeDrawer}>
						{t("common.close") ?? "Fermer"}
					</Button>
				</DrawerFooter>
			</Container>
		);
	}

	const columns = [
		{ key: "rank", label: t("leaderboard.rank"), align: "center" },
		{ key: "user_name", label: t("leaderboard.name"), align: "left" },
		{ key: "score", label: t("leaderboard.score"), align: "right" },
		{ key: "time_seconds", label: t("leaderboard.time"), align: "right" },
		{ key: "attempts", label: t("leaderboard.attempts"), align: "right" },
	];

	const entries = useMemo(() => {
		if (!quiz?.results) return [];

		let list = [...quiz.results];

		const text = searchText.trim().toLowerCase();
		if (text) {
			list = list.filter((row) =>
				Object.values(row).some((value) =>
					String(value).toLowerCase().includes(text)
				)
			);
		}

		list.sort((a, b) => {
			const valA = a[sortColumn];
			const valB = b[sortColumn];

			if (valA == null) return 1;
			if (valB == null) return -1;

			if (typeof valA === "string") {
				return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}
			return sortAsc ? valA - valB : valB - valA;
		});

		if (!text) {
			return list.slice(0, 10);
		}

		return list;
	}, [quiz, searchText, sortColumn, sortAsc]);

	const totalParticipants = quiz.results.length;

	return (
		<Container>
			{!hideHeader && (
				<DrawerHeader
					title={quiz.title}
					onClose={closeDrawer}
					icon={<Trophy size={20} />}
					subtitle={
						t("leaderboard.title", {
							owner: quiz.owner,
							count: totalParticipants,
						}) ||
						`${quiz.owner} • ${totalParticipants} participants`
					}
				/>
			)}

			<Content>
				<InfoRow>
					<InfoChip>
						<span>{t("leaderboard.owner")}</span>
						<strong>{quiz.owner}</strong>
					</InfoChip>
					<InfoChip>
						<span>{t("leaderboard.participants")}</span>
						<strong>{totalParticipants}</strong>
					</InfoChip>
				</InfoRow>

				<SearchRow>
					<SearchLabel>{t("leaderboard.searchPlaceholder")}</SearchLabel>
					<SearchInput
						type="text"
						placeholder={t("leaderboard.searchSpecificData")}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
					/>
					<HelpText>
						{t("leaderboard.searchUserHelp")}
					</HelpText>
				</SearchRow>

				<TableWrapper>
					<LeaderboardTable
						columns={columns}
						entries={entries}
						loading={false}
						sortColumn={sortColumn}
						sortAsc={sortAsc}
						onSortChange={(col, asc) => {
							setSortColumn(col);
							setSortAsc(asc);
						}}
						sortableColumns={[
							"rank",
							"user_name",
							"score",
							"time_seconds",
							"attempts",
						]}
					/>
				</TableWrapper>
			</Content>

			<DrawerFooter style={{ justifyContent: "flex-end" }}>
				<Button variant="ghost" onClick={closeDrawer}>
					{t("actions.back")}
				</Button>
			</DrawerFooter>
		</Container>
	);
};


const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`;

const Content = styled.div`
	flex: 1;
	padding: var(--spacing);
	display: flex;
	flex-direction: column;
	gap: var(--spacing);
	overflow-y: auto;
`;

const InfoRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-s);
`;

const InfoChip = styled.div`
	display: inline-flex;
	flex-direction: column;
	padding: 0.35rem 0.75rem;
	border-radius: 999px;
	background: var(--color-background-surface-4);
	border: 1px solid var(--color-border, rgba(255,255,255,0.16));
	font-size: 0.75rem;
	color: var(--color-text-muted);

	span {
		opacity: 0.8;
	}

	strong {
		font-size: 0.8rem;
		color: var(--color-text);
	}
`;

const SearchRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
`;

const SearchLabel = styled.label`
	font-size: 0.8rem;
	color: var(--color-text-muted);
`;

const SearchInput = styled.input`
	width: 100%;
	border-radius: var(--border-radius);
	border: 1px solid var(--color-border);
	background: var(--color-background-surface-4);
	padding: 0.45rem 0.7rem;
	color: var(--color-text);
	font-size: 0.85rem;

	&:focus {
		outline: none;
		border-color: var(--color-primary-bg);
		box-shadow: 0 0 0 1px var(--color-primary-bg);
	}
`;

const HelpText = styled.span`
	font-size: 0.7rem;
	opacity: 0.7;
	color: var(--color-text-muted);
`;

const TableWrapper = styled.div`
	margin-top: var(--spacing-xs);
`;

const EmptyState = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-text-muted);
	font-size: 0.9rem;
	text-align: center;
	padding: var(--spacing);
`;
