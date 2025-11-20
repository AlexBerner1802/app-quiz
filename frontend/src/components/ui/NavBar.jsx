import React from 'react';
import styled from 'styled-components';

const NavBar = ({ className, left, center, right }) => {
	return (
		<StyledAppBar className={className}>
			<NavSection $align="left">{left}</NavSection>
			<NavSection $align="center">{center}</NavSection>
			<NavSection $align="right">{right}</NavSection>
		</StyledAppBar>
	);
};

export default NavBar;

const StyledAppBar = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 64px;
	padding: 0.75rem 1.5rem;
	box-sizing: border-box;
	background-color: var(--color-background-muted);
	color: var(--color-text);
	border-bottom: 1px solid var(--color-border);
	position: sticky;
	top: 0;
	z-index: 10;

	@media (max-width: 768px) {
		height: 56px;
		padding: 0.5rem 1.5rem;
	}

	@media (max-width: 480px) {
		height: 48px;
		padding: 0.25rem 1.5rem;
	}
`;

const NavSection = styled.div`
	flex: ${({ $align }) => ($align === 'center' ? '2' : '1')};
	display: flex;
	justify-content: ${({ $align }) => {
	if ($align === 'left') return 'flex-start';
	if ($align === 'center') return 'center';
	if ($align === 'right') return 'flex-end';
}};
	align-items: center;
	min-width: 0; /* avoids overflowing */
`;
