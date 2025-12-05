import React from "react";
import styled from "styled-components";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

function formatTime(seconds) {
	if (seconds == null || isNaN(seconds)) return "_time_";
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LeaderboardTable({
	entries = [],
	loading,
	sortByRankAsc,
	onToggleSort,
}) {
	const { t } = useTranslation();

	return (
		<TableContainer>
			<HeaderRow>
				<HeaderCell style={{ width: 80 }}>
					{t("leaderboard.rank")}
				</HeaderCell>
				<HeaderCell>{t("leaderboard.name")}</HeaderCell>
                <HeaderCell>{t("leaderboard.quiz")}</HeaderCell>
				<HeaderCell>{t("leaderboard.score")}</HeaderCell>
				<HeaderCell>{t("leaderboard.time")}</HeaderCell>
				<HeaderCell>{t("leaderboard.attempts")}</HeaderCell>
				<HeaderCell
					$icon
					onClick={onToggleSort}
					title={t("leaderboard.sortByRank")}
				>
					<ArrowUpDown
						size={18}
						style={{
							transform: sortByRankAsc ? "rotate(0deg)" : "rotate(180deg)",
						}}
					/>
				</HeaderCell>
			</HeaderRow>

			<Body>
				{loading && (
					<EmptyRow>{t("leaderboard.loading")}</EmptyRow>
				)}

				{!loading && entries.length === 0 && (
					<EmptyRow>
						{t("leaderboard.empty")}
					</EmptyRow>
				)}

				{!loading &&
					entries.map((entry) => (
						<DataRow key={entry.id ?? `${entry.rank}-${entry.userName}`}>
							<Cell>{entry.rank}</Cell>
							<Cell>{entry.userName}</Cell>
                            <Cell>{entry.quizName}</Cell>
							<Cell>{entry.score}</Cell>
							<Cell>{formatTime(entry.timeSeconds)}</Cell>
							<Cell>{entry.attempts}</Cell>
							<Cell />
						</DataRow>
					))}
			</Body>
		</TableContainer>
	);
}

const TableContainer = styled.div`
	width: 100%;
	border-radius: var(--border-radius);
	background-color: var(--color-background-alt);
	overflow: hidden;
`;

const HeaderRow = styled.div`
	display: grid;
	grid-template-columns: 80px minmax(0, 1.8fr) repeat(4, 1fr) 40px;
	padding: 10px 16px;
	background-color: var(--color-background-alt);
	font-weight: 600;
	font-size: var(--font-size-s);
    color: var(--color-text);
`;

const HeaderCell = styled.div`
	display: flex;
	align-items: center;
	color: var(--color-text);
	cursor: ${({ $icon }) => ($icon ? "pointer" : "default")};
	justify-content: ${({ $icon }) => ($icon ? "flex-end" : "flex-start")};
`;

const Body = styled.div`
	display: flex;
	flex-direction: column;
`;

const DataRow = styled.div`
	display: grid;
	grid-template-columns: 80px minmax(0, 1.8fr) repeat(4, 1fr) 40px;
	padding: 8px 16px;
	background-color: var(--color-background-surface-4);
	font-size: var(--font-size-s);

	&:nth-child(even) {
		background-color: var(--color-background-surface-5);
	}
    color: var(--color-text);
`;

const Cell = styled.div`
	display: flex;
	align-items: center;
`;

const EmptyRow = styled.div`
	padding: 16px;
	text-align: center;
	color: var(--color-text-muted);
	font-size: var(--font-size-s);
`;
