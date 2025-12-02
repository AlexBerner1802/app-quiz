import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";


export default function QuizHeader({ title }) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<Header>
			<Button onClick={() => navigate(-1)} variant="ghost">
				<ChevronLeft size={30} />
			</Button>

			<HeaderTop>
				<h1>{title}</h1>
			</HeaderTop>
		</Header>
	);
}


const Header = styled.header`
    display: flex;
    gap: var(--spacing);
	background-color: var(--color-background);
	padding: var(--spacing);
	border: 1px solid var(--color-border);
	align-items: center;
`;

const HeaderTop = styled.div`
    display: grid;
    gap: var(--spacing-2xs);
`;