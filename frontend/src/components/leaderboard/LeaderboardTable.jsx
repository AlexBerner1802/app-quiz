import React from "react";
import styled from "styled-components";
import {ArrowUpDown, Award, Crown} from "lucide-react";
import { useTranslation } from "react-i18next";
import Invader from "../icons/Invader";
import {applyScoreMultiplier} from "../../utils/score";

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

	const getGridTemplateColumns = (columns) => {
		return columns
			.map(col => col.width || "1fr")
			.join(" ");
	};

	const template = getGridTemplateColumns(columns);

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

	const rankColor = {
		1: "var(--first-place)",
		2: "var(--second-place)",
		3: "var(--third-place)",
	};


	return (
		<TableContainer>
			<HeaderRow template={template}>
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
						<DataRow key={entry.id ?? entry.user_name} template={template}>
							{columns.map((col) => (
								<Cell key={col.key} $align={col.align}>
									{col.key === "user_name" ? (
										<AvatarWrapper>
											{entry.avatar ? (
												<AvatarImage src={entry.avatar} alt={entry.user_name} />
											) : (
												<AvatarCircle>
													<Invader size={30} color={"var(--color-input-placeholder)"} />
												</AvatarCircle>
											)}
											{entry.user_name}
											{entry.rank <= 3 && (
												<Crown
													size={16}
													color={rankColor[entry.rank]}
												/>
											)}
										</AvatarWrapper>
									) : col.key === "time_seconds" ? (
										<TimeWrapper title={`Best: ${formatTime(entry.best_time_seconds)} | Worst: ${formatTime(entry.worst_time_seconds)} | Total: ${formatTime(entry.total_time_seconds)} `}>
											{formatTime(entry.best_time_seconds)}
											{/*<DetailTimeWrapper>
												({formatTime(entry.total_time_seconds)})
											</DetailTimeWrapper>*/}
										</TimeWrapper>
									) : col.key === "score" ? (
										<ScoreTag
											$color={rankColor[entry.rank]}>
											{applyScoreMultiplier(entry[col.key])}
										</ScoreTag>
									) : (
										entry[col.key]
									)}
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
	overflow: hidden;
`;

const HeaderRow = styled.div`
    display: grid;
    grid-template-columns: ${({ template }) => template};
    padding: var(--spacing-s) var(--spacing-2xl);
    font-weight: 600;
    font-size: var(--font-size);
    color: var(--color-text);
    line-height: var(--spacing-xl);
`;

const HeaderCell = styled.div`
    display: flex;
    align-items: center;
    color: var(--color-text-muted);
	font-size: var(--font-size-xs);
	font-weight: 500;
	text-transform: uppercase;
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
    grid-template-columns: ${({ template }) => template};
    background-color: var(--color-background-surface-1);
    padding: var(--spacing-s) var(--spacing-2xl);
    font-size: var(--font-size);
    color: var(--color-text);
    line-height: var(--spacing-xl);
    margin: var(--spacing-2xs) 0;
    border-radius: var(--border-radius-full);
`;

const Cell = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: var(--font-size-s);
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

const AvatarWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: var(--spacing);
	font-size: var(--font-size-s);
	font-weight: 600;
`;

const AvatarCircle = styled.div`
	width: var(--spacing-2xl);
	height: var(--spacing-2xl);
	border-radius: var(--border-radius-xs);
	background-color: var(--color-background-surface-2);
	color: var(--color-input-placeholder);
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	flex-shrink: 0;
	overflow: hidden;
`;

const AvatarImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

const ScoreTag = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
    padding: var(--spacing-2xs) var(--spacing-s);
    border-radius: var(--border-radius-xs);
	gap: var(--spacing-s);
	font-weight: 600;
    color: var(--color-primary-bg, white);
    //color: ${({ $color }) => $color ?? "var(--color-primary-muted-text, white)"};
    font-family: "Orbitron", sans-serif;
`;

const TimeWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
`;

