// src/components/layout/Sidebar.jsx

import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import {useTranslation} from "react-i18next";


export default function Sidebar({ logoSrc, logoAlt = "Logo", itemsTop = [], itemsBottom = [], avatarText }) {

	const {t} = useTranslation();

	// Get the current URL to know which button is active
	const location = useLocation();

	// Displays a sidebar's element
	const renderItem = (item) => {
		// Tells if the element is displayed as active
		const isActive = (() => {
			if (item.activePattern instanceof RegExp) return item.activePattern.test(location.pathname);
			if (item.to) return location.pathname === item.to;
			return false;
		})();

		// Buttons with dynamic styles according to $active
		const Btn = (
			<TooltipWrapper key={item.key}>
				<IconButton title={item.title} $active={isActive} onClick={item.onClick} aria-label={item.title}>
					{item.icon}
				</IconButton>
				<Tooltip className="tooltip">{item.title}</Tooltip>
			</TooltipWrapper>
		);

		// If the element has a "to" route, we surround it with a <Link>
		return item.to ? (
			<StyledLink to={item.to} key={item.key}>
				{Btn}
			</StyledLink>
		) : (
			<span key={item.key}>{Btn}</span>
		);
	};

	return (
		<Aside>
			{/* Sidebar's upper part with the logo and itemsTop */}
			<Stack>
				{logoSrc ? (
					<LogoCircle title={logoAlt} aria-label={logoAlt}>
						<img src={logoSrc} alt={logoAlt} />
					</LogoCircle>
				) : (
					<LogoCircle title="Logo" aria-label="Logo">🦋</LogoCircle>
				)}

				{itemsTop.map(renderItem)}
			</Stack>

			{/* Down part of the sidebar with itemsBottom and the avatar */}
			<Stack>
				{itemsBottom.map(renderItem)}
				{avatarText ? (
					<TooltipWrapper>
						<Avatar>{avatarText}</Avatar>
						<Tooltip className="tooltip">{t("pages.accountPage")}</Tooltip>
					</TooltipWrapper>
				) : null}
			</Stack>
		</Aside>
	);
}


const Aside = styled.aside`
    width: var(--spacing-3xl);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--spacing) 0;
    align-items: center;
    background-color: var(--color-background-surface);
`;

const Stack = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    align-items: center;
`;

const StyledLink = styled(Link)`
    text-decoration: none;
`;

const LogoCircle = styled.div`
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    font-weight: bold;
    overflow: hidden;
	margin-bottom: var(--spacing-xs);

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

const IconButton = styled.button`
    border: none;
    background: none;
    padding: var(--spacing-s);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gray-500);

    /* hover */
    &:hover {
        background-color: var(--color-background-elevated);
    }

    /* active state */
    ${(p) =>
		p.$active &&
		`
    	color: var(--color-primary-bg);
	`}
`;

const Avatar = styled.div`
    width: 36px;
    height: 36px;
    border-radius: var(--border-radius);
    background-color: var(--color-background-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-s);
    font-weight: bold;
    color: var(--color-placeholder);
    margin-bottom: var(--spacing-xs);
`;

const TooltipWrapper = styled.div`
	position: relative;
	display: inline-block;

	&:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateY(-50%) translateX(8px);
	}
`;

const Tooltip = styled.div`
	position: absolute;
	top: 50%;
	left: 110%;
	transform: translateY(-50%) translateX(0);
	background-color: var(--color-background-elevated);
	color: var(--color-text);
	padding: var(--spacing-xs) var(--spacing-s);
	border-radius: var(--border-radius-s);
	font-size: var(--font-size-s);
    box-shadow: var(--box-shadow);
	white-space: nowrap;
	opacity: 0;
	visibility: hidden;
	transition: all 0.2s ease-in-out;
	pointer-events: none;
	z-index: 10;
`;
