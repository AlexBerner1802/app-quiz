// src/pages/results/GlobalLeaderboard/_index.jsx
import React, { useMemo, useState } from "react";
import {Award, Search, FileChartColumn, Crown} from "lucide-react";
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
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import FloatingIconBackground from "../../../components/FloatingIconBackground";
import Astronaut from "../../../components/icons/Astronaut";
import Atom from "../../../components/icons/Atom";
import {applyScoreMultiplier} from "../../../utils/score";


const mockEntries = [
	{ id: 1, rank: 1, user_name: "Alice", score: 19, total_time_seconds: 71, best_time_seconds: 35, worst_time_seconds: 36, quizzes_done: 2, attempts: 3 },
	{ id: 2, rank: 2, user_name: "Bob", score: 18, total_time_seconds: 85, best_time_seconds: 40, worst_time_seconds: 45, quizzes_done: 1, attempts: 1 },
	{ id: 3, rank: 3, user_name: "Charlie", score: 17, total_time_seconds: 90, best_time_seconds: 42, worst_time_seconds: 48, quizzes_done: 3, attempts: 4 },
	{ id: 4, rank: 4, user_name: "Denis", score: 15, total_time_seconds: 120, best_time_seconds: 55, worst_time_seconds: 65, quizzes_done: 1, attempts: 2 },
	{ id: 5, rank: 5, user_name: "Eva", score: 12, total_time_seconds: 150, best_time_seconds: 70, worst_time_seconds: 80, quizzes_done: 2, attempts: 2 },
	{ id: 6, rank: 6, user_name: "John", score: 10, total_time_seconds: 155, best_time_seconds: 72, worst_time_seconds: 83, quizzes_done: 5, attempts: 7 },
	{ id: 7, rank: 7, user_name: "Globert", score: 5, total_time_seconds: 170, best_time_seconds: 80, worst_time_seconds: 90, quizzes_done: 3, attempts: 3 },
	{ id: 8, rank: 8, user_name: "Tim", score: 4, total_time_seconds: 200, best_time_seconds: 95, worst_time_seconds: 105, quizzes_done: 3, attempts: 4 },
	{ id: 9, rank: 9, user_name: "Marie", score: 2, total_time_seconds: 234, best_time_seconds: 110, worst_time_seconds: 124, quizzes_done: 6, attempts: 8 },
	{ id: 10, rank: 10, user_name: "Karine", score: 1, total_time_seconds: 500, best_time_seconds: 240, worst_time_seconds: 260, quizzes_done: 33, attempts: 35 },
	{ id: 11, rank: 11, user_name: "Martine", score: 0, total_time_seconds: 538, best_time_seconds: 250, worst_time_seconds: 288, quizzes_done: 12, attempts: 15 },
];


const mockQuizzes = [
	{
		id: "quiz-1",
		title: "Quiz 1 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 1, rank: 1, user_name: "Alice", score: 20, total_time_seconds: 71, best_time_seconds: 35, worst_time_seconds: 36, attempts: 2 },
			{ id: 2, rank: 2, user_name: "Bob", score: 19, total_time_seconds: 85, best_time_seconds: 40, worst_time_seconds: 45, attempts: 1 },
			{ id: 3, rank: 3, user_name: "Charlie", score: 18, total_time_seconds: 90, best_time_seconds: 42, worst_time_seconds: 48, attempts: 3 },
			{ id: 4, rank: 4, user_name: "Denis", score: 15, total_time_seconds: 120, best_time_seconds: 55, worst_time_seconds: 65, attempts: 2 },
			{ id: 11, rank: 5, user_name: "Globert", score: 10, total_time_seconds: 144, best_time_seconds: 70, worst_time_seconds: 74, attempts: 3 },
			{ id: 5, rank: 6, user_name: "Eva", score: 8, total_time_seconds: 200, best_time_seconds: 95, worst_time_seconds: 105, attempts: 1 },
			{ id: 6, rank: 7, user_name: "John", score: 2, total_time_seconds: 201, best_time_seconds: 100, worst_time_seconds: 101, attempts: 2 },
		],
	},
	{
		id: "quiz-2",
		title: "Quiz 2 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 5, rank: 1, user_name: "Eva", score: 20, total_time_seconds: 60, best_time_seconds: 30, worst_time_seconds: 30, attempts: 1 },
			{ id: 6, rank: 2, user_name: "John", score: 18, total_time_seconds: 92, best_time_seconds: 45, worst_time_seconds: 47, attempts: 2 },
		],
	},
	{
		id: "quiz-3",
		title: "Quiz 3 - Formateur 2",
		owner: "Formateur 2",
		results: [
			{ id: 7, rank: 1, user_name: "Marie", score: 17, total_time_seconds: 75, best_time_seconds: 37, worst_time_seconds: 38, attempts: 2 },
			{ id: 8, rank: 2, user_name: "Tim", score: 14, total_time_seconds: 100, best_time_seconds: 48, worst_time_seconds: 52, attempts: 3 },
		],
	},
	{
		id: "quiz-4",
		title: "Quiz 4 - Formateur 1",
		owner: "Formateur 1",
		results: [
			{ id: 9, rank: 1, user_name: "Karine", score: 19, total_time_seconds: 68, best_time_seconds: 33, worst_time_seconds: 35, attempts: 1 },
		],
	},
	{
		id: "quiz-5",
		title: "Quiz 5 - Admin 2",
		owner: "Admin 2",
		results: [
			{ id: 10, rank: 1, user_name: "Martine", score: 16, total_time_seconds: 110, best_time_seconds: 55, worst_time_seconds: 55, attempts: 2 },
		],
	},
	{
		id: "quiz-6",
		title: "Quiz 6 - Formateur 2",
		owner: "Formateur 2",
		results: [
			{ id: 11, rank: 1, user_name: "Globert", score: 12, total_time_seconds: 140, best_time_seconds: 70, worst_time_seconds: 70, attempts: 4 },
		],
	},
	{
		id: "quiz-7",
		title: "Quiz 7 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 5, rank: 1, user_name: "Eva", score: 20, total_time_seconds: 60, best_time_seconds: 30, worst_time_seconds: 30, attempts: 1 },
			{ id: 6, rank: 2, user_name: "John", score: 18, total_time_seconds: 92, best_time_seconds: 45, worst_time_seconds: 47, attempts: 2 },
		],
	},
	{
		id: "quiz-8",
		title: "Quiz 8 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 5, rank: 1, user_name: "Eva", score: 20, total_time_seconds: 60, best_time_seconds: 30, worst_time_seconds: 30, attempts: 1 },
			{ id: 6, rank: 2, user_name: "John", score: 18, total_time_seconds: 92, best_time_seconds: 45, worst_time_seconds: 47, attempts: 2 },
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
		{ key: "rank", label: t("leaderboard.rank"), align: "center", width: "100px" },
		{ key: "user_name", label: t("leaderboard.name"), align: "left", width: "2fr" },
		{ key: "quizzes_done", label: t("leaderboard.quizzes_done"), align: "right", width: "1fr" },
		{ key: "score", label: t("leaderboard.score"), align: "right", width: "1fr" },
		{ key: "time_seconds", label: t("leaderboard.best_time"), align: "right", width: "1fr" },
		{ key: "attempts", label: t("leaderboard.attempts"), align: "right", width: "1fr" },
	];

	const rankColor = {
		1: "#FFD700", // gold
		2: "#C0C0C0", // silver
		3: "#CD7F32", // bronze
	};

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

					<FloatingIconBackground color={"var(--color-text)"} icon={<Astronaut />} />
					<FloatingIconBackground size={220} speed={0.4} color={"var(--color-text)"} icon={<Astronaut />}/>
					<FloatingIconBackground size={120} speed={0.9} color={"var(--color-text)"} icon={<Atom />}/>
					<FloatingIconBackground color={"var(--color-text)"} />
					<FloatingIconBackground size={120} speed={0.9} color={"var(--color-text)"}/>

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
								<ResponsiveMasonry
									columnsCountBreakPoints={{ 350: 1, 600: 2, 900: 3, 1200: 4 }}
								>
									<Masonry gutter={"var(--spacing)"}>
										{filteredQuizzes?.length > 0 && filteredQuizzes.map((quiz) => (
											<QuizCard
												key={quiz.id}
												onClick={() => handleQuizClick(quiz)}
											>
												<Overlay>
													<FileChartColumn size={40} color={"var(--color-primary-bg)"}/>
												</Overlay>

												<QuizHeader>
													<QuizTitle>{quiz.title}</QuizTitle>
													<QuizOwner>{quiz.owner}</QuizOwner>
												</QuizHeader>

												<MiniTable>
													{quiz.results.slice(0, 5).map((row, idx) => (
														<MiniRow key={row.id} index={idx}>
															<MiniCell>
																{row.rank}
															</MiniCell>
															<MiniCell>
																{row.rank <= 3 ? (
																	<>
																		{row.user_name}
																		<Crown size={14}
																			   color={rankColor[row.rank]}
																			   style={{ position: 'relative', top: "-1px" }} />
																	</>
																) : (
																	row.user_name
																)}
															</MiniCell>
															<MiniCell>
																{/*<Award size={16} color="var(--color-text-muted)" />*/}
																{applyScoreMultiplier(row.score)}
															</MiniCell>
														</MiniRow>
													))}
												</MiniTable>
											</QuizCard>
										))}
									</Masonry>
								</ResponsiveMasonry>
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
	background: var(--gradient-background);
	background-size: 400% 400%;
	transition: background 0.3s ease;
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

const QuizCard = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-radius: var(--border-radius, 18px);
    background: var(--color-background-surface-4);
    border: 1px solid var(--color-border);
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s ease;
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
	padding: var(--spacing);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	background: var(--color-background-alt);
`;

const QuizTitle = styled.p`
	text-align: center;
	font-size: var(--font-size);
	color: var(--color-text);
	font-weight: 500;
`;

const QuizOwner = styled.span`
	text-align: center;
    font-size: var(--font-size-s);
	color: var(--color-text-muted);
`;

const MiniTable = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    font-size: var(--font-size-s);
    color: var(--color-text);
`;

const MiniRow = styled.div`
    display: flex;
    align-items: center;
    padding: var(--spacing-s) var(--spacing);
    border-top: 1px solid var(--color-border);
    background: ${({ index }) => index % 2 === 0 ? 'var(--color-background-surface-3)' : 'transparent'};
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
        width: 50px; /* rank */
        justify-content: center;
    }
    &:nth-child(2) {
        flex: 1; /* user name */
    }
    &:last-child {
        display: flex;
        align-items: center;
        gap: var(--spacing-s);
        justify-content: flex-end; /* score / icon */
    }
`;

