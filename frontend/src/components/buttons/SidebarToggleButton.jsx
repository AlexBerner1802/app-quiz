import React from "react";
import styled from "styled-components";
import { useSidebar } from "../../context/sidebar/SidebarContext";
import { Menu } from "lucide-react";

export default function SidebarToggleButton({ titleOpen = "Expand sidebar", titleClose = "Reduce sidebar" }) {
    const { expanded, toggle } = useSidebar();

    return (
        <Btn
            type="button"
            onClick={toggle}
            aria-label={expanded ? titleClose : titleOpen}
            title={expanded ? titleClose : titleOpen}
        >
        <Menu size={20} />
        </Btn>
    );
}

const Btn = styled.button`
    border: none;
    background: none;
    padding: var(--spacing-s);
    border-radius: var(--border-radius-xs);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--color-text);

    transition: background 0.2s, color 0.2s;

    & svg {
        stroke: currentColor;
    }

    &:hover {
        background-color: var(--color-background-surface-3);
        color: var(--color-primary-bg);
    }
`;