// src/components/layout/Header.jsx

import React from "react";
import styled from "styled-components";
import { ChevronLeft } from "lucide-react";
import {useTranslation} from "react-i18next";

export default function PageHeader({
									   title,
									   icon,
									   actions,
									   withBorder = false,
									   goBack = false,
								   }) {

	const {t} = useTranslation();

	const handleGoBack = () => {
		if (typeof goBack === "function") {
			goBack();
		} else {
			window.history.back();
		}
	};

	return (
		<Header $withBorder={withBorder}>
			<Left>
				{goBack ? (
					<BackButton onClick={handleGoBack} title={t("actions.back")}>
						<ChevronLeft size={30} />
					</BackButton>
				) : null}

				{icon ? <span>{icon}</span> : null}
				<h1>{title}</h1>
			</Left>

			<Right>
				{Array.isArray(actions)
					? actions.map((a, i) => <span key={i}>{a}</span>)
					: actions}
			</Right>
		</Header>
	);
}

const Header = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing);
    gap: var(--spacing-s);
    color: var(--color-text);
	height: 68px;
    background-color: var(--color-background);
    border-bottom: ${({ $withBorder }) =>
            $withBorder ? "1px solid var(--color-border)" : "none"};
`;

const Left = styled.div`
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    h1 {
        line-height: 40px;
		font-weight: 600;
        font-size: var(--font-size-2xl);
    }

    span {
        display: flex;
        align-items: center;
        height: 100%;
    }
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
`;

const BackButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--border-radius-s);
    transition: all 0.2s ease;

    &:hover {
        background: none;
		svg {
            transition: all 0.2s ease;
			stroke: var(--color-primary-bg);
		}
    }
`;
