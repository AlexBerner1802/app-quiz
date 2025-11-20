import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

export default function QuizHeader({ title, createdAt, updatedAt, description, coverImageUrl }) {
    const created = createdAt?.slice?.(0, 10) ?? "—";
    const updated = updatedAt?.slice?.(0, 10) ?? "—";
    const { t } = useTranslation();

    return (
        <Header>
        <HeaderTop>
            <h1>{title}</h1>
            <Meta>
            <span>{t("quiz.show.createdAt")}{created}</span>
            <span>•</span>
            <span>{t("quiz.show.modifiedAt")}{updated}</span>
            </Meta>
        </HeaderTop>

        {coverImageUrl && (
            <Cover
            src={coverImageUrl.startsWith("/")
                ? (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + coverImageUrl
                : coverImageUrl}
            alt={title}
            loading="lazy"
            />
        )}

        {description && <Description>{description}</Description>}
        </Header>
    );
}

const Header = styled.header`
    display: grid;
    gap: var(--spacing);
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
