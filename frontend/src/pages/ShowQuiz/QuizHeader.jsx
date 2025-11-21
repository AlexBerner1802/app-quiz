import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";

export default function QuizHeader({ title, createdAt, updatedAt }) {
	const created = createdAt?.slice?.(0, 10) ?? "—";
	const updated = updatedAt?.slice?.(0, 10) ?? "—";
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<Header>
			<Button onClick={() => navigate(-1)} variant="ghost">
				<ChevronLeft size={30} />
			</Button>

			<HeaderTop>
				<h1>{title}</h1>
				<Meta>
					<span>{t("quiz.show.createdAt")}{created}</span>
					<span>•</span>
					<span>{t("quiz.show.modifiedAt")}{updated}</span>
				</Meta>
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
`;

const BackButton = styled(Button)`
`;

const HeaderTop = styled.div`
    display: grid;
    gap: var(--spacing-2xs);
`;

const Meta = styled.div`
    color: var(--color-text-muted);
    display: flex;
    gap: 8px;
    font-size: var(--font-size-s);
`;

const Description = styled.p`
    font-size: var(--font-size);
    color: var(--color-text);
    margin: 0;
`;

const Cover = styled.img`
    width: 100%;
    height: auto;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    object-fit: cover;
    max-height: 360px;
`;
