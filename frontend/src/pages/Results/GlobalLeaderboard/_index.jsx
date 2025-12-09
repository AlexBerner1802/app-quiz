// src/pages/results/_index.jsx
import React, { useMemo, useState } from "react";
import { Award, Search } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";
import Header from "../../../components/layout/Header.jsx";
import FaviconTitle from "../../../components/layout/Icon.jsx";
import faviconUrl from "../../../assets/images/favicon.ico?url";
import LeaderboardPodium from "../../../components/leaderboard/LeaderboardPodium.jsx";
import LeaderboardTable from "../../../components/leaderboard/LeaderboardTable.jsx";
import ToggleThemeSwitch from "../../../components/ui/ToggleThemeSwitch.jsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../../../components/ui/Tabs";
import Input from "../../../components/ui/Input";
import {useDrawer} from "../../../context/drawer";


const mockEntries = [
	{ id: 1, rank: 1, user_name: "Alice", score: 19, time_seconds: 71, quizzes_done: 2, attempts: 3 },
	{ id: 2, rank: 2, user_name: "Bob", score: 18, time_seconds: 85, quizzes_done: 1, attempts: 1 },
	{ id: 3, rank: 3, user_name: "Charlie", score: 17, time_seconds: 90, quizzes_done: 3, attempts: 4 },
	{ id: 4, rank: 4, user_name: "Denis", score: 15, time_seconds: 120, quizzes_done: 1, attempts: 2 },
	{ id: 5, rank: 5, user_name: "Eva", score: 12, time_seconds: 150, quizzes_done: 2, attempts: 2 },
	{ id: 6, rank: 6, user_name: "John", score: 10, time_seconds: 155, quizzes_done: 5, attempts: 7 },
	{ id: 7, rank: 7, user_name: "Globert", score: 5, time_seconds: 170, quizzes_done: 3, attempts: 3 },
	{ id: 8, rank: 8, user_name: "Tim", score: 4, time_seconds: 200, quizzes_done: 3, attempts: 4 },
	{ id: 9, rank: 9, user_name: "Marie", score: 2, time_seconds: 234, quizzes_done: 6, attempts: 8 },
	{ id: 10, rank: 10, user_name: "Karine", score: 1, time_seconds: 500, quizzes_done: 33, attempts: 35 },
	{ id: 11, rank: 11, user_name: "Martine", score: 0, time_seconds: 538, quizzes_done: 12, attempts: 15 },
];

const mockQuizzes = [
	{
		id: "quiz-1",
		title: "Quiz 1 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 1, rank: 1, user_name: "Alice", score: 20, time_seconds: 71, attempts: 2 },
			{ id: 2, rank: 2, user_name: "Bob", score: 19, time_seconds: 85, attempts: 1 },
			{ id: 3, rank: 3, user_name: "Charlie", score: 18, time_seconds: 90, attempts: 3 },
			{ id: 4, rank: 4, user_name: "Denis", score: 15, time_seconds: 120, attempts: 2 },
			{ id: 11, rank: 5, user_name: "Globert", score: 10, time_seconds: 144, attempts: 3 },
		],
	},
	{
		id: "quiz-2",
		title: "Quiz 2 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 5, rank: 1, user_name: "Eva", score: 20, time_seconds: 60, attempts: 1 },
			{ id: 6, rank: 2, user_name: "John", score: 18, time_seconds: 92, attempts: 2 },
		],
	},
	{
		id: "quiz-3",
		title: "Quiz 3 - Formateur 2",
		owner: "Formateur 2",
		results: [
			{ id: 7, rank: 1, user_name: "Marie", score: 17, time_seconds: 75, attempts: 2 },
			{ id: 8, rank: 2, user_name: "Tim", score: 14, time_seconds: 100, attempts: 3 },
		],
	},
	{
		id: "quiz-4",
		title: "Quiz 4 - Formateur 1",
		owner: "Formateur 1",
		results: [{ id: 9, rank: 1, user_name: "Karine", score: 19, time_seconds: 68, attempts: 1 },],
	},
	{
		id: "quiz-5",
		title: "Quiz 5 - Admin 2",
		owner: "Admin 2",
		results: [{ id: 10, rank: 1, user_name: "Martine", score: 16, time_seconds: 110, attempts: 2 },],
	},
	{
		id: "quiz-6",
		title: "Quiz 6 - Formateur 2",
		owner: "Formateur 2",
		results: [{ id: 11, rank: 1, user_name: "Globert", score: 12, time_seconds: 140, attempts: 4 },],
	},
	{
		id: "quiz-7",
		title: "Quiz 7 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 5, rank: 1, user_name: "Eva", score: 20, time_seconds: 60, attempts: 1 },
			{ id: 6, rank: 2, user_name: "John", score: 18, time_seconds: 92, attempts: 2 },
		],
	},
	{
		id: "quiz-8",
		title: "Quiz 8 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 5, rank: 1, user_name: "Eva", score: 20, time_seconds: 60, attempts: 1 },
			{ id: 6, rank: 2, user_name: "John", score: 18, time_seconds: 92, attempts: 2 },
		],
	},
];


export default function ResultsPage() {
	const { t } = useTranslation();
	const { openDrawer } = useDrawer();

	const [entries] = useState(mockEntries);
	const [quizEntries] = useState(mockQuizzes);
	const [searchText, setSearchText] = useState("");
	const [sortColumn, setSortColumn] = useState("rank");
	const [sortAsc, setSortAsc] = useState(true);


	const columns = [
		{ key: "rank", label: t("leaderboard.rank"), align: "center" },
		{ key: "user_name", label: t("leaderboard.name"), align: "left" },
		{ key: "quizzes_done", label: t("leaderboard.quizzes_done"), align: "right" },
		{ key: "score", label: t("leaderboard.score"), align: "right" },
		{ key: "time_seconds", label: t("leaderboard.time"), align: "right" },
		{ key: "attempts", label: t("leaderboard.attempts"), align: "right" },
	];


	const handleQuizClick = (quiz) => {
		openDrawer("quizResult", { quiz });
	};

	const podiumEntries = useMemo(() => {
		return [...entries].sort((a, b) => a.rank - b.rank).slice(0, 3);
	}, [entries]);

	const tableEntries = useMemo(() => {
		const text = searchText.toLowerCase().trim();

		let list = [...entries];

		// Sort dynamically by sortColumn
		list.sort((a, b) => {
			const valA = a[sortColumn];
			const valB = b[sortColumn];

			if (valA == null) return 1;
			if (valB == null) return -1;

			if (typeof valA === "string") {
				return sortAsc
					? valA.localeCompare(valB)
					: valB.localeCompare(valA);
			}

			return sortAsc ? valA - valB : valB - valA;
		});

		// Filter by search text
		if (text) {
			list = list.filter((entry) =>
				entry.user_name.toLowerCase().includes(text)
			);
		}

		return list;
	}, [entries, searchText, sortColumn, sortAsc]);

	const filteredQuizzes = useMemo(() => {
		let list = [...quizEntries];
	
		const text = searchText.trim().toLowerCase();
		if (text) {
			list = list.filter((quiz) => {
				return (
					quiz.title.toLowerCase().includes(text) ||
					quiz.owner.toLowerCase().includes(text)
				);
			});
		}

		list.sort((a, b) => a.title.localeCompare(b.title));
	
		return list;
	}, [quizEntries, searchText]);

	const pageTitle = t("pages.leaderboardPage") || "Global leaderboard";


	return (
		<>
			<FaviconTitle title={pageTitle} iconHref={faviconUrl} />

			<Main>
				<Header
					title={t("leaderboard.title")}
					icon={<Award size={20} />}
					actions={
						<ToggleThemeSwitch/>
					}
				/>

				<Content>
					<AnimatedBlock>
						<PodiumWrapper>
							<LeaderboardPodium entries={podiumEntries} />
						</PodiumWrapper>
					</AnimatedBlock>

					<AnimatedBlock style={{ animationDelay: "0.25s" }}>
						<Tabs defaultValue="leaderboard">
							<HeaderGrid>
								<TabsList>
									<TabsTrigger style={{ minWidth: "var(--spacing-5xl)"}} value="leaderboard">{t("leaderboard.filterDefault")}</TabsTrigger>
									<TabsTrigger style={{ minWidth: "var(--spacing-5xl)"}} value="quizzes">{t("leaderboard.quiz")}</TabsTrigger>
								</TabsList>
								<SearchBarWrapper>
									<Input
										icon={<Search size={20} color={"var(--color-text-muted)"} />}
										placeholder={
											t("leaderboard.searchPlaceholder")}
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
									loading={false}
									sortColumn={sortColumn}
									sortAsc={sortAsc}
									onSortChange={(column, asc) => {
										setSortColumn(column);
										setSortAsc(asc);
									}}
									sortableColumns={["rank","user_name","score","quizzes_done","time_seconds","attempts"]}
								/>
							</TabsContent>

							<TabsContent value={"quizzes"}>
									<QuizGrid>
										{filteredQuizzes?.length > 0 && filteredQuizzes.map((quiz) => (
											<QuizCard
												key={quiz.id}
												onClick={() => handleQuizClick(quiz)}
											>
												<QuizTitle>{quiz.title}</QuizTitle>
												<QuizOwner>{quiz.owner}</QuizOwner>

												<MiniTable>
													<thead>
														<tr>
															<th>#</th>
															<th>{t("leaderboard.name")}</th>
															<th>{t("leaderboard.time")}</th>
															<th>{t("leaderboard.score")}</th>
														</tr>
													</thead>
													<tbody>
														{quiz.results.slice(0, 5).map((row) => (
															<tr key={row.id}>
																<td>{row.rank}</td>
																<td>{row.user_name}</td>
																<td>{row.time_seconds}s</td>
																<td>{row.score}</td>
															</tr>
														))}
													</tbody>
												</MiniTable>

												<CardFooterHint>
													{t("leaderboard.clickForDetails") ??
														"Cliquer pour voir le classement complet"}
												</CardFooterHint>
											</QuizCard>
										))}
									</QuizGrid>
							</TabsContent>
						</Tabs>
					</AnimatedBlock>
				</Content>

			</Main>
		</>
	);
}


const Main = styled.main`
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
	background-color: var(--color-background);
`;

const Content = styled.section`
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: var(--spacing-xl);
	gap: var(--spacing-l);
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

const QuizGrid = styled.div`
    display: grid;
	margin-top: var(--spacing-l);
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--spacing);
    width: 100%;
`;

const QuizCard = styled.button`
	display: flex;
	flex-direction: column;
	width: 100%;

	border-radius: var(--border-radius-l, 18px);
	padding: var(--spacing-s);
	background: var(--color-background-surface-4);
	border: 1px solid var(--color-border);
    box-shadow: var(--box-shadow-l);
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease,
		border-color 0.15s ease, background 0.15s ease;

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35);
		border-color: var(--color-primary-bg, #4f46e5);
		background: radial-gradient(
			circle at top left,
			rgba(79, 70, 229, 0.16),
			var(--color-background-surface-1, rgba(0, 0, 0, 0.3))
		);
	}
`;

const QuizTitle = styled.h3`
	text-align: center;
	font-size: 0.95rem;
	font-weight: 600;
	margin: 0 0 0.2rem 0;
`;

const QuizOwner = styled.div`
	text-align: center;
	font-size: 0.8rem;
	opacity: 0.8;
	margin-bottom: var(--spacing-s);
	color: var(--color-text);
`;

const MiniTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 0.8rem;
	table-layout: fixed;
	color: var(--color-text);

	th,
	td {
		padding: 0.15rem 0.3rem;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	th {
		font-weight: 600;
		border-bottom: 1px solid var(--color-border-strong);
	}

	tbody tr:nth-child(even) {
		background: var(--color-background-surface-5);
	}

	tbody tr {
		border-bottom: 1px solid var(--color-border-strong);
		border-right: 1px solid var(--color-border-strong);
		border-left: 1px solid var(--color-border-strong);
	}
`;

const CardFooterHint = styled.div`
	margin-top: auto;
	font-size: 0.7rem;
	text-align: right;
	opacity: 0.7;
	color: var(--color-text);
`;