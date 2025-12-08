// src/pages/results/QuizLeaderboardPage.jsx
import React, { useMemo, useState } from "react";
import { Award, ChevronLeft } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import Header from "../../../components/layout/Header.jsx";
import FaviconTitle from "../../../components/layout/Icon.jsx";
import faviconUrl from "../../../assets/images/favicon.ico?url";
import LeaderboardSearchBar from "../../../components/leaderboard/LeaderboardSearchBar.jsx";
import ToggleThemeSwitch from "../../../components/ui/ToggleThemeSwitch.jsx";

import { QuizResultsDrawer } from "../../../components/drawers/QuizResultsDrawer.jsx";

const mockQuizzes = [
	{
		id: "quiz-1",
		title: "Quiz 1 - Admin 1",
		owner: "Admin 1",
		results: [
			{ id: 1, rank: 1, user_name: "Alice", score: 19, time_seconds: 71, attempts: 2 },
			{ id: 2, rank: 2, user_name: "Bob", score: 18, time_seconds: 85, attempts: 1 },
			{ id: 3, rank: 3, user_name: "Charlie", score: 17, time_seconds: 90, attempts: 3 },
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
		results: [
			{ id: 9, rank: 1, user_name: "Karine", score: 19, time_seconds: 68, attempts: 1 },
		],
	},
	{
		id: "quiz-5",
		title: "Quiz 5 - Admin 2",
		owner: "Admin 2",
		results: [
			{ id: 10, rank: 1, user_name: "Martine", score: 16, time_seconds: 110, attempts: 2 },
		],
	},
	{
		id: "quiz-6",
		title: "Quiz 6 - Formateur 2",
		owner: "Formateur 2",
		results: [
			{ id: 11, rank: 1, user_name: "Globert", score: 12, time_seconds: 140, attempts: 4 },
		],
	},
];

export default function QuizLeaderboardPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [searchText, setSearchText] = useState("");
	const [filter, setFilter] = useState("quiz");
	const [sortMode, setSortMode] = useState("quiz");

	const [selectedQuiz, setSelectedQuiz] = useState(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const pageTitle = t("pages.quizLeaderboardPage") || "Leaderboard par quiz";

	const filteredQuizzes = useMemo(() => {
		let list = [...mockQuizzes];

		const text = searchText.trim().toLowerCase();
		if (text) {
			list = list.filter((quiz) => {
				return (
					quiz.title.toLowerCase().includes(text) ||
					quiz.owner.toLowerCase().includes(text)
				);
			});
		}

		if (sortMode === "owner") {
			list.sort((a, b) => {
				const byOwner = a.owner.localeCompare(b.owner);
				if (byOwner !== 0) return byOwner;
				return a.title.localeCompare(b.title);
			});
		} else {
			list.sort((a, b) => a.title.localeCompare(b.title));
		}

		return list;
	}, [searchText, sortMode]);

	const handleQuizClick = (quiz) => {
		setSelectedQuiz(quiz);
		setIsDrawerOpen(true);
	};

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
		setSelectedQuiz(null);
	};

	return (
		<>
			<FaviconTitle title={pageTitle} iconHref={faviconUrl} />

			<Main>
				<ToggleThemeSwitch />

				<Header
					title={t("leaderboard.quizOverview") ?? "Résultats - par quiz"}
					icon={<Award size={20} />}
				/>

				<Content>
					<SearchBarWrapper>
						<LeaderboardSearchBar
							value={searchText}
							filter={filter}
							onChange={setSearchText}
							onFilterChange={(newFilter) => {
								setFilter(newFilter);

								if (newFilter === "default" || newFilter === "global") {
									navigate("/results");
								} else if (newFilter === "quiz") {
								} else if (newFilter === "user") {
									navigate("/users");
								}
							}}
						/>
					</SearchBarWrapper>

					<TopActionsRow>
						<GhostButton onClick={() => navigate("/results")}>
							<ChevronLeft size={16} />
							<span>
								{t("leaderboard.backToGlobal") ??
									"Retour au classement global"}
							</span>
						</GhostButton>
					</TopActionsRow>

					<SortModeRow>
						<SortToggle
							$isActive={sortMode === "quiz"}
							onClick={() => setSortMode("quiz")}
						>
							{t("leaderboard.sortByQuiz") ?? "Trier par quiz"}
						</SortToggle>
						<SortToggle
							$isActive={sortMode === "owner"}
							onClick={() => setSortMode("owner")}
						>
							{t("leaderboard.sortByOwner") ?? "Trier par owner"}
						</SortToggle>
					</SortModeRow>

					<AnimatedBlock>
						<QuizGrid>
							{filteredQuizzes.map((quiz) => (
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
					</AnimatedBlock>
				</Content>

				{isDrawerOpen && selectedQuiz && (
					<DrawerOverlay>
						<DrawerPanel>
							<QuizResultsDrawer
								quiz={selectedQuiz}
								closeDrawer={handleCloseDrawer}
							/>
						</DrawerPanel>
					</DrawerOverlay>
				)}
			</Main>
		</>
	);
}

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`;

const Main = styled.main`
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
	background-color: var(--color-background);
	position: relative;
`;

const Content = styled.section`
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: var(--spacing);
	gap: var(--spacing-l);
`;

const SearchBarWrapper = styled.div`
	display: flex;
	justify-content: center;
	position: relative;
	z-index: 1;
	margin-bottom: var(--spacing-s);
`;

const TopActionsRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--spacing-m);
	gap: var(--spacing-s);
	flex-wrap: wrap;
`;

const GhostButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.45rem 0.8rem;
	border-radius: 999px;
	border: 1px solid var(--color-border-subtle, #2684ff);
	background: #2684ff;
	color: var(--color-text);
	font-size: 0.85rem;
	cursor: pointer;
	transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

	&:hover {
		background: var(--color-surface-subtle, rgba(255, 255, 255, 0.04));
		border-color: var(--color-border-strong, rgba(255, 255, 255, 0.24));
		color: var(--color-text);
	}
`;

const SortModeRow = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.4rem;
	margin-bottom: var(--spacing-s);
	flex-wrap: wrap;
`;

const SortToggle = styled.button`
	padding: 0.25rem 0.7rem;
	border-radius: 999px;
	border: 1px solid
		${(props) =>
			props.$isActive
				? "var(--color-primary-bg, #2684ff)"
				: "var(--color-border-subtle, #2684ff)"};
	background: ${(props) =>
		props.$isActive
			? "var(--color-primary-muted, #2684ff)"
			: "transparent"};
	color: ${(props) =>
		props.$isActive ? "var(--color-text)" : "var(--color-text-muted)"};
	font-size: 0.75rem;
	cursor: pointer;
	transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
`;

const AnimatedBlock = styled.div`
	opacity: 0;
	width: 100%;
	animation: ${fadeIn} 0.3s ease forwards;
`;

const QuizGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: var(--spacing-l);
`;

const QuizCard = styled.button`
	display: flex;
	flex-direction: column;
	width: 105%;
	height: 180px;
	max-height: 180px;

	border-radius: var(--border-radius-l, 18px);
	padding: var(--spacing-s);
	background: var(--color-background-surface-4);
	border: 1px solid var(--color-border);
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
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
			var(--color-surface, rgba(0, 0, 0, 0.3))
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

const DrawerOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	justify-content: flex-end;
	z-index: 999;
`;

const DrawerPanel = styled.div`
	width: min(480px, 100%);
	height: 100%;
	background: var(--color-background);
	box-shadow: -8px 0 20px rgba(0, 0, 0, 0.35);
	display: flex;
	flex-direction: column;
`;
