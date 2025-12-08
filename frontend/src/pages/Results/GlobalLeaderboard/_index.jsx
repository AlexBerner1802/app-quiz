// src/pages/results/_index.jsx
import React, { useMemo, useState } from "react";
import {Award } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";
import Header from "../../../components/layout/Header.jsx";
import FaviconTitle from "../../../components/layout/Icon.jsx";
import faviconUrl from "../../../assets/images/favicon.ico?url";
import LeaderboardPodium from "../../../components/leaderboard/LeaderboardPodium.jsx";
import LeaderboardSearchBar from "../../../components/leaderboard/LeaderboardSearchBar.jsx";
import LeaderboardTable from "../../../components/leaderboard/LeaderboardTable.jsx";
import ToggleThemeSwitch from "../../../components/ui/ToggleThemeSwitch.jsx";
import { useNavigate } from "react-router-dom";

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

export default function ResultsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [entries] = useState(mockEntries);
	const [searchText, setSearchText] = useState("");
	const [filter, setFilter] = useState("global");
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

	const pageTitle =
		t("pages.leaderboardPage") || "Global leaderboard";

	return (
		<>
			<FaviconTitle title={pageTitle} iconHref={faviconUrl} />

			<Main>
                <ToggleThemeSwitch/>

				<Header
					title={t("leaderboard.subtitle")}
					icon={<Award size={20} />}
				/>

				<Content>
					<AnimatedBlock>
						<PodiumWrapper>
							<LeaderboardPodium entries={podiumEntries} />
						</PodiumWrapper>
					</AnimatedBlock>

					<AnimatedBlock style={{ animationDelay: "0.1s" }}>
						<SearchBarWrapper>
							<LeaderboardSearchBar
								value={searchText}
								filter={filter}
								onChange={setSearchText}
								onFilterChange={(newFilter) => {
									setFilter(newFilter);

									if (newFilter === "quiz") {
										navigate("/results/quizzes");
									} else if (newFilter === "user") {
										navigate("/users");
									}
								}}
							/>
						</SearchBarWrapper>
					</AnimatedBlock>
					<AnimatedBlock style={{ animationDelay: "0.15s" }}>
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
	padding: var(--spacing);
	gap: var(--spacing-l);
`;

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`;

const SearchBarWrapper = styled.div`
	display: flex;
	justify-content: center;
	position: relative;
	z-index: 50;
`;

const AnimatedBlock = styled.div`
	opacity: 0;
	width: 100%;
	animation: ${fadeIn} 0.4s ease forwards;
`;

const PodiumWrapper = styled.div`
	display: flex;
	justify-content: center;
`;
