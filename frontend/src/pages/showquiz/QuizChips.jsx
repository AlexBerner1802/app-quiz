import React from "react";
import styled from "styled-components";

export default function QuizChips({ label, items, itemKey = "id", itemLabel = "name", variant }) {
    if (!Array.isArray(items) || items.length === 0) return null;

    return (
        <Block>
        <BlockLabel>{label}</BlockLabel>
        <Chips>
            {items.map((it) => (
            <Chip key={it[itemKey]} data-variant={variant}>
                {it[itemLabel]}
            </Chip>
            ))}
        </Chips>
        </Block>
    );
}

const Block = styled.div`
    display: grid;
    gap: 8px;
`;

const BlockLabel = styled.div`
    font-weight: 600;
    font-size: var(--font-size-s);
`;

const Chips = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const Chip = styled.span`
    padding: 4px 8px;
    border-radius: 999px;
    font-size: var(--font-size-xs);
    border: 1px solid var(--color-border);
    background: ${({['data-variant']:v}) => v === 'secondary' ? 'var(--quiz-surface-muted)' : 'transparent'};
`;
