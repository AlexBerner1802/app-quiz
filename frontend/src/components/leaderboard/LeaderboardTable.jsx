import React from "react";
import styled from "styled-components";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LeaderboardTable({
											 columns= [],
											 entries = [],
											 loading,
											 sortColumn,
											 sortAsc,
											 onSortChange,
											 sortableColumns = [], // e.g. ["rank", "user_name", "score", "quizzes_done", "time_seconds", "attempts"]
										 }) {
	const { t } = useTranslation();

	const handleHeaderClick = (column) => {
		if (!sortableColumns.includes(column)) return;

		if (sortColumn === column) {
			onSortChange(column, !sortAsc); // toggle direction
		} else {
			onSortChange(column, true); // default ascending
		}
	};

	const formatTime = (seconds) => {
		if (seconds == null || isNaN(seconds)) return "_time_";
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	};

	return (
		<TableContainer>
			<HeaderRow>
				{columns.map((col) => (
					<HeaderCell
						key={col.key}
						$icon={sortableColumns.includes(col.key)}
						$align={col.align}
						onClick={() => handleHeaderClick(col.key)}
						title={
							sortColumn === col.key
								? `${col.label} (${sortAsc ? "asc" : "desc"})`
								: col.label
						}
					>
						{col.label}
						{sortableColumns.includes(col.key) && (
							<ArrowUpDown
								size={16}
								style={{
									transform:
										sortColumn === col.key && !sortAsc
											? "rotate(180deg)"
											: "rotate(0deg)",
									marginLeft: "var(--spacing-s)",
								}}
							/>
						)}
					</HeaderCell>
				))}
			</HeaderRow>

			<Body>
				{loading && <EmptyRow>{t("leaderboard.loading")}</EmptyRow>}
				{!loading && entries.length === 0 && (
					<EmptyRow>{t("leaderboard.empty")}</EmptyRow>
				)}
				{!loading &&
					entries.map((entry) => (
						<DataRow key={entry.id ?? entry.user_name}>
							{columns.map((col) => (
								<Cell key={col.key} $align={col.align}>
									{col.key === "time_seconds" ? formatTime(entry[col.key]) : entry[col.key]}
								</Cell>
							))}
						</DataRow>
					))}
			</Body>
		</TableContainer>
	);
}

const TableContainer = styled.div`
	width: 100%;
	border-radius: var(--border-radius-s);
	background-color: var(--color-background-alt);
	overflow: hidden;
`;

const HeaderRow = styled.div`
	display: grid;
	grid-template-columns: 100px minmax(0, 1.8fr) repeat(4, 1fr) 40px;
	padding: var(--spacing-s);
	background-color: var(--color-background-alt);
	font-weight: 600;
	font-size: var(--font-size);
    color: var(--color-text);
	line-height: var(--spacing-xl);
`;

const HeaderCell = styled.div`
    display: flex;
    align-items: center;
    color: var(--color-text);
    cursor: ${({ $icon }) => ($icon ? "pointer" : "default")};
    justify-content: ${({ $align }) =>
            $align === "right" ? "flex-end" :
                    $align === "center" ? "center" :
                            "flex-start"};
`;

const Body = styled.div`
	display: flex;
	flex-direction: column;
`;

const DataRow = styled.div`
	display: grid;
	grid-template-columns: 100px minmax(0, 1.8fr) repeat(4, 1fr) 40px;
	background-color: var(--color-background-surface-4);
	padding: var(--spacing-s);
	font-size: var(--font-size);
	color: var(--color-text);
	line-height: var(--spacing-xl);

	&:nth-child(even) {
		background-color: var(--color-background-surface-3);
	}
`;

const Cell = styled.div`
    display: flex;
    align-items: center;
    justify-content: ${({ $align }) =>
            $align === "right" ? "flex-end" :
                    $align === "center" ? "center" :
                            "flex-start"};
`;

const EmptyRow = styled.div`
	padding: var(--spacing);
	text-align: center;
	color: var(--color-text-muted);
	font-size: var(--font-size-s);
`;
