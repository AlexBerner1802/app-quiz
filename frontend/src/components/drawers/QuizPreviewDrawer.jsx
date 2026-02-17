import React, { useMemo } from "react";
import styled from "styled-components";
import Button from "../ui/Button";
import Tag from "../ui/Tag";
import { DrawerHeader, DrawerFooter } from "../../context/drawer/DrawerProvider";
import { Play } from "lucide-react";
import { t } from "i18next";

export function QuizPreviewDrawer({ quiz, closeDrawer, onStart }) {
    const {
        title,
        description,
        modules = [],
        tags = [],
        is_active = true,
        cover_image_url,
    } = quiz || {};

    const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || "http://localhost:8000";
    const resolvedImg = cover_image_url?.startsWith("/")
        ? `${MEDIA_URL}${cover_image_url}`
        : cover_image_url;

    const moduleNames = useMemo(
        () => (Array.isArray(modules) ? modules.map((m) => m?.name).filter(Boolean) : []),
        [modules]
    );

    const tagNames = useMemo(
        () => (Array.isArray(tags) ? tags.map((t) => t?.name).filter(Boolean) : []),
        [tags]
    );

    return (
        <Wrapper>
        <DrawerHeader title={title || "Quiz"} onClose={closeDrawer} />

        <Body>
            {resolvedImg && <Cover style={{ backgroundImage: `url(${resolvedImg})` }} />}

            {!is_active && (
            <InactiveNote>
                {t("common.inactive")}
            </InactiveNote>
            )}

            {description && <Description>{description}</Description>}

            {!!moduleNames.length && (
            <Block>
                <Label>{t("common.modules")}</Label>
                <Pills>
                {moduleNames.map((name) => (
                    <Tag key={name} size="s" variant="secondary">
                    {name}
                    </Tag>
                ))}
                </Pills>
            </Block>
            )}

            {!!tagNames.length && (
            <Block>
                <Label>{t("common.tags")}</Label>
                <Pills>
                {tagNames.map((name) => (
                    <Tag key={name} size="s" variant="secondary">
                    {name}
                    </Tag>
                ))}
                </Pills>
            </Block>
            )}
        </Body>

        <DrawerFooter>
            <FooterRow>
            <Button variant="secondary" onClick={closeDrawer}>
                {t("common.close")}
            </Button>

            <Button
                onClick={() => {
                if (!is_active) return;
                closeDrawer?.();
                onStart?.();
                }}
                disabled={!is_active}
            >
                <Play size={18} />
                {t("quiz.startQuiz")}
            </Button>
            </FooterRow>
        </DrawerFooter>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
	width: var(--spacing-9xl);
`;

const Body = styled.div`
    flex: 1;
    padding: var(--spacing);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
    overflow-y: auto;
	width: 100%;
`;

const Cover = styled.div`
    width: 100%;
    height: min(240px, 30vh);
    border-radius: var(--border-radius-s);
    background-size: cover;
    background-position: center;
    border: 1px solid var(--color-border);
`;

const Description = styled.p`
    margin: 0;
    color: var(--color-text);
    line-height: 1.4;
`;

const Block = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
`;

const Label = styled.div`
    font-size: var(--font-size-s);
    color: var(--color-text-muted);
    font-weight: 600;
`;

const Pills = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
`;

const FooterRow = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-s);
`;

const InactiveNote = styled.div`
    padding: var(--spacing-s);
    border-radius: var(--border-radius-s);
    background: rgba(255, 0, 0, 0.08);
    color: var(--color-text);
    border: 1px solid rgba(255, 0, 0, 0.15);
`;
