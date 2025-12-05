import React, { useState } from "react";
import styled from "styled-components";
import { Funnel, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function LeaderboardSearchBar({
	value,
	filter,
	onChange,
	onFilterChange,
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	const handleSelect = (key) => {
		onFilterChange(key);
		setOpen(false);
	};

	return (
		<Wrapper>
			<FilterWrapper>
				<Button
					variant="secondary"
					onClick={() => setOpen((o) => !o)}
					title={t("leaderboard.filter")}
					size="m"
				>
					<Funnel size={18} />
				</Button>

				{open && (
					<Menu>
						<MenuItem
							onClick={() => handleSelect("default")}
							$active={filter === "default"}
						>
							{t("leaderboard.filterDefault")}
						</MenuItem>
						<MenuItem
							onClick={() => handleSelect("user")}
							$active={filter === "user"}
						>
							{t("leaderboard.filterUsers")}
						</MenuItem>
						<MenuItem
							onClick={() => handleSelect("quiz")}
							$active={filter === "quiz"}
						>
							{t("leaderboard.filterQuiz")}
						</MenuItem>
					</Menu>
				)}
			</FilterWrapper>

			<SearchInputWrapper>
				<Input
					icon={<Search size={20} color={"var(--color-text-muted)"} />}
					placeholder={
						t("leaderboard.searchPlaceholder")}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					size="m"
					width="100%"
				/>
			</SearchInputWrapper>
		</Wrapper>
	);
}

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	gap: var(--spacing-s);
	width: 100%;
	max-width: 640px;
	position: relative;
`;

const LeftGroup = styled.div`
	display: flex;
	align-items: center;
	position: relative;
`;

const FilterWrapper = styled.div`
	position: relative;
`;

const Menu = styled.div`
	position: absolute;
	left: calc(-220px - 50px);
	top: -50px;
	min-width: 220px;
	background-color: var(--color-background);
	border-radius: var(--border-radius);
	box-shadow: var(--box-shadow-l);
	padding: 4px 0;
	z-index: 999;
`;

const MenuItem = styled.button`
	width: 100%;
	text-align: left;
	padding: 10px 14px;
	border: none;
	background-color: ${({ $active }) =>
		$active ? "var(--color-background-muted)" : "transparent"};
	cursor: pointer;
	font-size: var(--font-size-s);

	&:hover {
		background-color: var(--color-background-muted);
	}
    color: var(--color-text);
`;

const SearchInputWrapper = styled.div`
	flex: 1;
`;