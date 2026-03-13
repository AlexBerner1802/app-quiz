// src/components/layout/Sidebar.jsx

import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../../context/sidebar/SidebarContext";
import {PanelLeftClose, PanelRightClose} from "lucide-react";

export default function Sidebar({
	logoSrc,
	logoAlt = "Logo",
	itemsTop = [],
	itemsBottom = [],
	avatarText,
	profileTo
}) {

	const { t } = useTranslation();
	const { expanded, toggle } = useSidebar();

	// Get the current URL to know which button is active
	const location = useLocation();

	// Displays a sidebar's element
	const renderItem = (item) => {
		// Tells if the element is displayed as active
		const isActive = (() => {
			if (item.activePattern instanceof RegExp)
				return item.activePattern.test(location.pathname);
			if (item.to)
				return location.pathname === item.to;
			return false;
		})();

		// Button content (icon + label if expanded)
		const { toggle } = useSidebar();

		const content = (
			<IconButton
				title={!expanded ? item.title : undefined}
				$active={isActive}
				onClick={(e) => {
					if (item.key === "toggle") {
						toggle();
						return;
					}
					item.onClick?.(e);
				}}
				aria-label={item.title}
				$expanded={expanded}
				type="button"
			>
				<IconWrapper>{item.icon}</IconWrapper>
				{expanded && <Label>{item.title}</Label>}
			</IconButton>
		);

		// If sidebar is collapsed → use tooltip
		const Btn = expanded ? (
			<Row key={item.key}>{content}</Row>
		) : (
			<TooltipWrapper key={item.key}>
				{content}
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
		<Aside $expanded={expanded}>


			<Header $expanded={expanded}>
				{expanded ? (
					<HeaderExpand>
						<LogoWrapper>
							<img src={logoSrc} alt={logoAlt} />
							<LogoText>{logoAlt}</LogoText>
						</LogoWrapper>

						<ToggleButton onClick={toggle}>
							<PanelLeftClose size={20} strokeWidth={2} />
						</ToggleButton>
					</HeaderExpand>
				) : (
					<ToggleButton onClick={toggle}>
						<PanelRightClose size={20} strokeWidth={2} />
					</ToggleButton>
				)}
			</Header>

			{/* Sidebar's upper part with itemsTop */}
			<TopStack $expanded={expanded}>
				{itemsTop.map(renderItem)}
			</TopStack>

			{/* Down part of the sidebar with itemsBottom and the avatar */}
			<BottomStack $expanded={expanded}>
				{itemsBottom.map(renderItem)}
				{avatarText ? (
					expanded ? (
						<Row>
							{profileTo ? (
								<StyledLink to={profileTo}>
									<IconButton
										title={t("pages.accountPage")}
										type="button"
										$expanded={expanded}
									>
										<Avatar>{avatarText}</Avatar>
										<Label>{t("pages.accountPage")}</Label>
									</IconButton>
								</StyledLink>
							) : (
								<IconButton
									type="button"
									$expanded={expanded}
									style={{ opacity: 0.6 }}
								>
									<Avatar>{avatarText}</Avatar>
									<Label>{t("pages.accountPage")}</Label>
								</IconButton>
							)}
						</Row>
					) : (
						<AccountWrapper>
							{profileTo ? (
									<StyledLink to={profileTo}>
										<IconButton
											title={t("pages.accountPage")}
											type="button"
											$expanded={false}
										>
											<Avatar>{avatarText}</Avatar>
										</IconButton>
									</StyledLink>
							) : (
								<IconButton
									type="button"
									$expanded={false}
									style={{ opacity: 0.6 }}
								>
									<Avatar>{avatarText}</Avatar>
								</IconButton>
							)}

							<Tooltip className="account-tooltip">
								{t("pages.accountPage")}
							</Tooltip>
						</AccountWrapper>
					)
				) : null}
			</BottomStack>


			<ResizeHandle onClick={toggle} />

		</Aside>
	);
}


const Aside = styled.aside`
    position: relative;
    width: ${(p) => (p.$expanded ? "240px" : "var(--spacing-3xl)")};
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    padding: var(--spacing) 0;
    align-items: ${(p) => (p.$expanded ? "stretch" : "center")};
    background-color: var(--color-background-muted);
    transition: width 0.2s ease;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: ${(p) => (p.$expanded ? "space-between" : "center")};
	padding: var(--spacing-s);
	margin-bottom: var(--spacing);
`;

const HeaderExpand = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 var(--spacing-s);
	width: 100%;
`;

const LogoWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-s);

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
`;

const LogoText = styled.span`
	text-transform: uppercase;
	font-size: var(--font-size-l);
	color: var(--color-text);
	font-weight: 600;
	margin-top: 1px;
`;

const ToggleButton = styled.button`
	border: none;
	background: none;
	cursor: pointer;
	padding: var(--spacing-xs);
	border-radius: var(--border-radius-xs);
	color: var(--color-input-placeholder);
    display: flex;
    align-items: center;
    justify-content: center;

	&:hover {
		background: transparent;
		color: var(--color-text);
	}
`;

const TopStack = styled.div`
	display: flex;
	flex-direction: column;
	//gap: var(--spacing-s);
	align-items: ${(p) => (p.$expanded ? "stretch" : "center")};
	padding: ${(p) => (p.$expanded ? "0 var(--spacing-s)" : "0")};
	margin-bottom: auto;
`;

const BottomStack = styled.div`
	display: flex;
	flex-direction: column;
	//gap: var(--spacing-s);
	align-items: ${(p) => (p.$expanded ? "stretch" : "center")};
	padding: ${(p) => (p.$expanded ? "0 var(--spacing-s)" : "0")};
`;

const ResizeHandle = styled.div`
	position: absolute;
	top: 0;
	right: -4px;
	width: 4px;
	height: 100%;
	cursor: ew-resize;
	transition: all 0.2s ease;
	z-index: 5;

	&:hover {
		background: var(--color-border);
	}
`;

const StyledLink = styled(Link)`
	text-decoration: none;
`;

const Row = styled.div`
	position: relative;
`;

const IconWrapper = styled.span`
	display: grid;
	place-items: center;
	width: 32px;
	height: 32px;
`;

const Label = styled.span`
	font-size: var(--font-size-s);
	color: var(--color-text);
	white-space: nowrap;
`;

const IconButton = styled.button`
	border: none;
	background: none;
	padding: var(--spacing-s);
	border-radius: var(--border-radius-xs);
	cursor: pointer;
	transition: background 0.2s;
	display: flex;
	align-items: center;
	justify-content: ${(p) => (p.$expanded ? "flex-start" : "center")};
	gap: ${(p) => (p.$expanded ? "var(--spacing-s)" : "0")};
	width: ${(p) => (p.$expanded ? "100%" : "auto")};
	color: var(--gray-500);

	&:hover {
		//background-color: var(--color-background-surface-3);
		background-color: transparent;

		& svg {
			stroke: var(--color-primary-bg);
            transition: all 0.2s ease;
		}
		
		& span {
			color: var(--color-primary-bg);
            transition: all 0.2s ease;
		}
		
		& div {
            color: var(--color-primary-bg);
            transition: all 0.2s ease;
		}
	}

	/* active state */
	${(p) =>
		p.$active &&
		`
			color: var(--color-primary-bg);
			cursor: default;
			
			& span {
				color: var(--color-primary-bg);
			}
		`
	}
`;

const Avatar = styled.div`
	width: 32px;
	height: 32px;
	border-radius: var(--border-radius-full);
	background-color: var(--color-background-surface-3);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: bold;
	color: var(--color-text-muted);
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
	left: 100%;
	transform: translateY(-50%) translateX(0);
	background-color: var(--color-background-surface-3);
	color: var(--color-text);
	padding: var(--spacing-s);
	border-radius: var(--border-radius-2xs);
	border: 1px solid var(--color-border);
	font-size: var(--font-size-s);
	box-shadow: var(--box-shadow-l);
	white-space: nowrap;
	opacity: 0;
	visibility: hidden;
	transition: all 0.2s ease-in-out;
	pointer-events: none;
	z-index: 10;
`;

const AccountWrapper = styled.div`
	position: relative;
	display: inline-block;

	&:hover .account-tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateY(-50%) translateX(8px);
	}
`;