// src/pages/results/GlobalLeaderboard/_index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Award, Search, FileChartColumn, Crown } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";
import FaviconTitle from "../../../components/layout/Icon.jsx";
import faviconUrl from "../../../assets/images/favicon.ico?url";
import LeaderboardPodium from "../../../components/leaderboard/LeaderboardPodium.jsx";
import LeaderboardTable from "../../../components/leaderboard/LeaderboardTable.jsx";
import ToggleThemeSwitch from "../../../components/ui/ToggleThemeSwitch.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import Input from "../../../components/ui/Input";
import { useDrawer } from "../../../context/drawer";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { applyScoreMultiplier } from "../../../utils/score";


import api from "../../../services/axiosClient";

export default function ResultsPage() {
	const { t, i18n } = useTranslation();
	const { openDrawer } = useDrawer();

	const [entries, setEntries] = useState([]);
	const [quizEntries, setQuizEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [searchText, setSearchText] = useState("");
	const [sortColumn, setSortColumn] = useState("rank");
	const [sortAsc, setSortAsc] = useState(true);

	const MINI_TABLE_MAX_ROWS = Number(import.meta.env.VITE_QUIZ_LEADDERBOARD_MAX_ROW ?? 5);

	const columns = [
		{ key: "rank", label: t("leaderboard.rank"), align: "left", width: "100px" },
		{ key: "user_name", label: t("leaderboard.name"), align: "left", width: "2fr" },
		{ key: "score", label: t("leaderboard.score"), align: "right", width: "1fr" },
		{ key: "time_seconds", label: t("leaderboard.bestTime"), align: "right", width: "1fr" },
		{ key: "quizzes_done", label: t("leaderboard.quizzesDone"), align: "right", width: "1fr" },
		{ key: "attempts", label: t("leaderboard.attempts"), align: "right", width: "1fr" },
	];

	const rankColor = {
		1: "#FFD700",
		2: "#C0C0C0",
		3: "#CD7F32",
	};

	const handleQuizClick = (quiz) => {
		openDrawer("quizResult", { quiz });
	};

	useEffect(() => {
		let cancelled = false;

		(async () => {
			setLoading(true);
			setError(null);

			try {
				const lang = (i18n.language || "fr").toLowerCase();

				const res = await api.get("/api/leaderboard", {
					params: { lang },
				});

				const rows = Array.isArray(res.data) ? res.data : [];
				setEntries(buildGlobalLeaderboard(rows));
				setQuizEntries(buildQuizzesLeaderboard(rows));


				const global = buildGlobalLeaderboard(rows);
				const byQuiz = buildQuizzesLeaderboard(rows);

				if (!cancelled) {
					setEntries(global);
					setQuizEntries(byQuiz);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e?.response?.data?.message || e?.message || "Failed to load leaderboard");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [i18n.language]);


	const podiumEntries = useMemo(() => {
		return [...entries].sort((a, b) => a.rank - b.rank).slice(0, 3);
	}, [entries]);

	const tableEntries = useMemo(() => {
		const text = searchText.toLowerCase().trim();

		let list = [...entries];

		if (text) {
			list = list.filter((entry) =>
			(entry.user_name || "").toLowerCase().includes(text)
			);
		}

		list.sort((a, b) => {
			const valA = a[sortColumn];
			const valB = b[sortColumn];

			if (valA == null && valB == null) return 0;
			if (valA == null) return 1;
			if (valB == null) return -1;

			let cmp = 0;

			if (typeof valA === "string") cmp = valA.localeCompare(valB);
			else cmp = valA - valB;

			if (!sortAsc) cmp *= -1;

			if (cmp === 0 && (sortColumn === "score" || sortColumn === "rank")) {
			const ta = a.time_seconds ?? Number.MAX_SAFE_INTEGER;
			const tb = b.time_seconds ?? Number.MAX_SAFE_INTEGER;
			if (ta !== tb) return ta - tb;
			}

			if (cmp === 0 && sortColumn === "time_seconds") {
			if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
			}

			if (cmp === 0) return (a.user_name || "").localeCompare(b.user_name || "");
			return cmp;
		});

		return list;
		}, [entries, searchText, sortColumn, sortAsc]);


	const filteredQuizzes = useMemo(() => {
		let list = [...quizEntries];

		const text = searchText.trim().toLowerCase();
		if (text) {
			list = list.filter((quiz) => {
				const title = (quiz.title || "").toLowerCase();
				const owner = (quiz.owner || "").toLowerCase();
				return title.includes(text) || owner.includes(text);
			});
		}

		list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
		return list;
	}, [quizEntries, searchText]);

	const pageTitle = t("pages.leaderboardPage") || "Global leaderboard";

	return (
		<>
			<FaviconTitle title={pageTitle} iconHref={faviconUrl} />

			<Main>
				<Content>
					<ContentHead>
						<TitleContainer>
							<Award size={30} strokeWidth={2.4} aria-hidden="true" color={"var(--color-text)"} />
							<Title>{t("leaderboard.title")}</Title>
							<ToggleThemeSwitch />
						</TitleContainer>
					</ContentHead>

					{error && (
						<ErrorBox>
							{error}
						</ErrorBox>
					)}

					<AnimatedBlock>
						<PodiumWrapper>
							<LeaderboardPodium entries={podiumEntries} loading={loading} />
						</PodiumWrapper>
					</AnimatedBlock>

					<AnimatedBlock style={{ animationDelay: "0.25s" }}>
						<Tabs defaultValue="leaderboard">
							<HeaderGrid>
								<TabsList>
									<TabsTrigger style={{ minWidth: "var(--spacing-5xl)" }} value="leaderboard">
										{t("leaderboard.filterDefault")}
									</TabsTrigger>
									<TabsTrigger style={{ minWidth: "var(--spacing-5xl)" }} value="quizzes">
										{t("leaderboard.quiz")}
									</TabsTrigger>
								</TabsList>

								<SearchBarWrapper>
									<Input
										icon={<Search size={20} color={"var(--color-text-muted)"} />}
										placeholder={t("leaderboard.searchPlaceholder")}
										value={searchText}
										onChange={(e) => setSearchText(e.target.value)}
										size="m"
										width="100%"
									/>
								</SearchBarWrapper>
							</HeaderGrid>

							<TabsContent value="leaderboard">
								<LeaderboardTable
									columns={columns}
									entries={tableEntries}
									loading={loading}
									sortColumn={sortColumn}
									sortAsc={sortAsc}
									onSortChange={(column, asc) => {
										setSortColumn(column);
										setSortAsc(asc);
									}}
									sortableColumns={["rank", "score", "user_name", "quizzes_done", "time_seconds", "attempts"]}
								/>
							</TabsContent>

							<TabsContent value={"quizzes"}>
								{loading ? (
									<LoadingBox>{t("common.loading") || "Loading..."}</LoadingBox>
								) : (
									<ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 600: 2, 900: 3, 1200: 4 }}>
										<Masonry gutter={"var(--spacing)"}>
											{filteredQuizzes?.length > 0 &&
												filteredQuizzes.map((quiz) => {
													const results = quiz.results || [];
													const visibleRows = results.slice(0, MINI_TABLE_MAX_ROWS);
													const remainingCount = results.length - visibleRows.length;

													return (
														<QuizCard key={quiz.id} onClick={() => handleQuizClick(quiz)}>
															<Overlay>
																<FileChartColumn size={40} color={"var(--color-primary-bg)"} />
															</Overlay>

															<QuizHeader>
																<QuizTitle>{quiz.title}</QuizTitle>
															</QuizHeader>

															<MiniTable>
																{visibleRows.map((row, idx) => (
																	<MiniRow key={`${quiz.id}-${row.id}`} $index={idx}>
																		<MiniCell>{row.rank}</MiniCell>

																		<MiniCell>
																			{row.rank <= 3 ? (
																				<>
																					{row.user_name}
																					<Crown
																						size={14}
																						color={rankColor[row.rank]}
																						style={{ position: "relative", top: "-1px" }}
																					/>
																				</>
																			) : (
																				row.user_name
																			)}
																		</MiniCell>

																		<MiniCell>{applyScoreMultiplier(row.score)}</MiniCell>
																	</MiniRow>
																))}

																{remainingCount > 0 && (
																	<MiniRow $index={visibleRows.length} $isMore>
																		<MiniCell />
																		<MiniCell />
																		<MoreCell>+{remainingCount} participants</MoreCell>
																	</MiniRow>
																)}
															</MiniTable>
														</QuizCard>
													);
												})}
										</Masonry>
									</ResponsiveMasonry>
								)}
							</TabsContent>
						</Tabs>
					</AnimatedBlock>
				</Content>
			</Main>
		</>
	);
}

function pickDisplayName(r) {
	return r?.name ?? r?.userName ?? r?.user_name ?? "Unknown";
}

function num(x, fallback = 0) {
	const n = Number(x);
	return Number.isFinite(n) ? n : fallback;
}

function buildGlobalLeaderboard(rows) {
	const byUser = new Map();

	for (const r of rows) {
		const userId = r?.id;
		if (userId == null) continue;

		if (!byUser.has(userId)) {
			byUser.set(userId, {
				id: userId,
				user_name: pickDisplayName(r),
				score: 0,
				time_seconds: 0,
				attempts: 0,
				_quizKeys: new Set(),
			});
		}

		const u = byUser.get(userId);

		u.score += num(r?.score);
		u.time_seconds += num(r?.timeSeconds ?? r?.time_seconds);
		u.attempts += num(r?.attempts);

		const quizKey = r?.quizId ?? r?.id_quiz ?? r?.quizName ?? r?.quiz_title;
		if (quizKey != null) u._quizKeys.add(String(quizKey));
	}

	const list = Array.from(byUser.values()).map((u) => ({
		id: u.id,
		user_name: u.user_name,
		score: num(u.score),
		time_seconds: num(u.time_seconds),
		quizzes_done: u._quizKeys.size,
		attempts: num(u.attempts),
		rank: 0,
	}));

	list.sort((a, b) => {
		if (b.score !== a.score) return b.score - a.score;
		if (a.time_seconds !== b.time_seconds) return a.time_seconds - b.time_seconds;
		return (a.user_name || "").localeCompare(b.user_name || "");
	});

	return list.map((x, idx) => ({ ...x, rank: idx + 1 }));
}

function buildQuizzesLeaderboard(rows) {
	const byQuiz = new Map();

	for (const r of rows) {
		const quizId = r?.quizId ?? r?.id_quiz ?? null;
		const quizName = r?.quizName ?? r?.quiz_title ?? "Quiz";

		const key = quizId != null ? String(quizId) : String(quizName);

		if (!byQuiz.has(key)) {
			byQuiz.set(key, {
				id: key,
				title: quizName,
				owner: "",
				results: [],
			});
		}

		byQuiz.get(key).results.push({
			id: r?.id,
			user_name: pickDisplayName(r),
			score: num(r?.score),
			time_seconds: num(r?.timeSeconds ?? r?.time_seconds),
			attempts: num(r?.attempts),
			rank: 0,
		});
	}

	const quizzes = Array.from(byQuiz.values());

	for (const q of quizzes) {
		q.results.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			if (a.time_seconds !== b.time_seconds) return a.time_seconds - b.time_seconds;
			return (a.user_name || "").localeCompare(b.user_name || "");
		});
		q.results = q.results.map((x, idx) => ({ ...x, rank: idx + 1 }));
	}

	return quizzes;
}


const Main = styled.main`
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
	background: var(--color-background);
`;

const Content = styled.section`
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: var(--spacing-xl);
	gap: var(--spacing-l);
	width: 100%;
	max-width: var(--spacing-16xl);
	margin: 0 auto;
`;

const ContentHead = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	margin-bottom: var(--spacing-l);
`;

const TitleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: var(--spacing-s);
`;

const Title = styled.h1`
	font-weight: 600;
	font-size: var(--font-size-4xl);
	font-family: "Poppins", sans-serif;
	line-height: 1;
`;

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`;

const AnimatedBlock = styled.div`
	opacity: 0;
	width: 100%;
	animation: ${fadeIn} 0.4s ease forwards;
`;

const HeaderGrid = styled.div`
	display: flex;
	align-items: center;
	flex-direction: column;
	width: 60%;
	max-width: var(--spacing-12xl);
	margin: 0 auto;
	gap: var(--spacing-s);
`;

const SearchBarWrapper = styled.div`
	display: flex;
	justify-content: center;
	position: relative;
	margin-bottom: var(--spacing);
	width: 100%;
	flex: 1;
`;

const PodiumWrapper = styled.div`
	display: flex;
	justify-content: center;
`;

const MiniRow = styled.div`
	display: flex;
	align-items: center;
	padding: var(--spacing) var(--spacing-l);
	background: ${({ index }) => (index % 2 === 0 ? "transparent" : "var(--color-background)")};
	transition: all 0.2s ease;

	${({ $isMore }) =>
		$isMore &&
		`
      opacity: 0.8;
      font-style: italic;
    `}
`;

const QuizCard = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	width: 100%;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		outline: 2px solid var(--color-primary-bg);
		background: var(--color-primary-muted);

		& ${MiniRow} {
			background: var(--color-primary-muted);
		}
	}
`;

const Overlay = styled.div`
	position: absolute;
	inset: 0;
	background: var(--color-background-overlay);
	display: flex;
	justify-content: center;
	align-items: center;
	opacity: 0;
	transition: all 0.2s ease;
	z-index: 1;

	${QuizCard}:hover & {
		opacity: 1;
	}
`;

const QuizHeader = styled.div`
	padding: var(--spacing) var(--spacing);
	display: flex;
	justify-content: center;
	flex-direction: column;
`;

const QuizTitle = styled.p`
	font-size: var(--font-size-s);
	color: var(--color-text-muted);
	font-weight: 500;
`;

const MiniTable = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	font-size: var(--font-size-s);
	color: var(--color-text);
	border-radius: var(--border-radius-l);
	background: var(--color-background-surface-1);
	box-shadow: var(--box-shadow-xs);
	border: 1px solid var(--color-border);
	overflow: hidden;
`;

const MiniCell = styled.div`
	display: flex;
	align-items: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-weight: 500;
	gap: var(--spacing-s);

	&:first-child {
		width: 50px;
	}
	&:nth-child(2) {
		flex: 1;
	}
	&:last-child {
		display: flex;
		align-items: center;
		gap: var(--spacing-s);
		justify-content: flex-end;
		font-family: "Orbitron", sans-serif;
	}
`;

const MoreCell = styled.div`
	flex: 1;
	text-align: right;
	font-size: var(--font-size-xs);
	font-weight: 600;
	color: var(--color-text-muted);
`;

const ErrorBox = styled.div`
	padding: var(--spacing);
	border: 1px solid var(--color-border);
	background: var(--color-background-surface-1);
	color: var(--color-text);
	border-radius: var(--border-radius-l);
`;

const LoadingBox = styled.div`
	padding: var(--spacing);
	color: var(--color-text-muted);
`;
