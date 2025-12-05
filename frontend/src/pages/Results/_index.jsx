// src/pages/results/_index.jsx
import React, { useMemo, useState } from "react";
import { Award } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/auth";
import Header from "../../components/layout/Header";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import LeaderboardPodium from "../../components/leaderboard/LeaderboardPodium";
import LeaderboardSearchBar from "../../components/leaderboard/LeaderboardSearchBar";
import LeaderboardTable from "../../components/leaderboard/LeaderboardTable";
import ToggleThemeSwitch
 from "../../components/ui/ToggleThemeSwitch.jsx";
const mockEntries = [
	{
		id: 1,
		rank: 1,
		userName: "Alice",
		score: 19,
		timeSeconds: 71,
		attempts: 2,
		quizName: "HTTP / API",
	},
	{
		id: 2,
		rank: 2,
		userName: "Bob",
		score: 18,
		timeSeconds: 85,
		attempts: 1,
		quizName: "Sécurité",
	},
	{
		id: 3,
		rank: 3,
		userName: "Charlie",
		score: 17,
		timeSeconds: 90,
		attempts: 3,
		quizName: "Auth",
	},
	{
		id: 4,
		rank: 4,
		userName: "Denis",
		score: 15,
		timeSeconds: 120,
		attempts: 1,
		quizName: "HTTP / API",
	},
	{
		id: 5,
		rank: 5,
		userName: "Eva",
		score: 12,
		timeSeconds: 150,
		attempts: 2,
		quizName: "Sécurité",
	},
    {
		id: 6,
		rank: 6,
		userName: "John",
		score: 10,
		timeSeconds: 155,
		attempts: 5,
		quizName: "Sécurité",
	},
    {
		id: 7,
		rank: 7,
		userName: "Globert",
		score: 5,
		timeSeconds: 170,
		attempts: 3,
		quizName: "HTTP / API",
	},
    {
		id: 8,
		rank: 8,
		userName: "Tim",
		score: 4,
		timeSeconds: 200,
		attempts: 3,
		quizName: "Auth",
	},
    {
		id: 9,
		rank: 9,
		userName: "Marie",
		score: 2,
		timeSeconds: 234,
		attempts: 6,
		quizName: "HTTP / API",
	},
    {
		id: 10,
		rank: 10,
		userName: "Karine",
		score: 1,
		timeSeconds: 500,
		attempts: 33,
		quizName: "Auth",
	},
    {
		id: 11,
		rank: 11,
		userName: "Martine",
		score: 0,
		timeSeconds: 538,
		attempts: 12,
		quizName: "HTTP / API",
	},
];

export default function ResultsPage() {
	const { t } = useTranslation();
	const { user } = useAuth();

	const [entries] = useState(mockEntries);
	const [searchText, setSearchText] = useState("");
	const [filter, setFilter] = useState("default");
	const [sortByRankAsc, setSortByRankAsc] = useState(true);

	const podiumEntries = useMemo(() => {
		return [...entries].sort((a, b) => a.rank - b.rank).slice(0, 3);
	}, [entries]);

	const tableEntries = useMemo(() => {
		const text = searchText.toLowerCase().trim();

		let list = [...entries];

		list.sort((a, b) =>
			sortByRankAsc ? a.rank - b.rank : b.rank - a.rank
		);

		if (!text) {
			return list.filter((entry) => entry.rank > 3);
		}

		return list.filter((entry) => {
			const name = entry.userName.toLowerCase();
			const quiz = (entry.quizName || "").toLowerCase();
			return name.includes(text) || quiz.includes(text);
		});
	}, [entries, searchText, sortByRankAsc]);

	const pageTitle =
		t("pages.results.globalLeaderboard") || "Global leaderboard";

	const handleToggleSort = () => setSortByRankAsc((prev) => !prev);

	return (
		<>
			<FaviconTitle title={pageTitle} iconHref={faviconUrl} />

			<Main>
                <ToggleThemeSwitch/>
				<Header
					title={pageTitle}
					icon={<Award size={20} />}
					withBorder={false}
				/>

				<Content>
                    <SubTitle>{t("leaderboard.subtitle")}</SubTitle>
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
								onFilterChange={setFilter}
							/>
						</SearchBarWrapper>
					</AnimatedBlock>
					<AnimatedBlock style={{ animationDelay: "0.15s" }}>
						<LeaderboardTable
							entries={tableEntries}
							loading={false}
							sortByRankAsc={sortByRankAsc}
							onToggleSort={handleToggleSort}
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

const SubTitle = styled.h2`
    font-size: 28px;
    font-weight: 500;
    text-align: center;
    color:var(--color-text);
`;
