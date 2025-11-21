// Tag.jsx
import React from "react";
import styled, { css } from "styled-components";

const variants = {
	primary: css`
        background: var(--color-primary-bg);
        color: var(--color-primary-text);
        border: 1px solid transparent;
  `,
	secondary: css`
        background: var(--color-background-surface-3);
        color: var(--color-secondary-text);
        border: 1px solid transparent;
  `,
	ghost: css`
        background: transparent;
        color: var(--color-primary-bg);
        border: 1px solid var(--color-primary-bg);
  `,
};

const sizes = {
	xs: css`
        font-size: 0.625rem; /* 10px */
        font-weight: 400;
        padding: 2px 6px;
  `,
	s: css`
        font-size: 0.75rem; /* 12px */
        font-weight: 400;
        padding: 4px 8px;
  `,
	m: css`
        font-size: 0.875rem; /* 14px */
        font-weight: 400;
        padding: 4px 10px;
  `,
	l: css`
        font-size: 1rem; /* 16px */
        font-weight: 400;
        padding: 6px 12px;
  `,
};

export default function Tag({ children, variant = "primary", size = "m", ...props }) {
	return (
		<StyledTag $variant={variant} $size={size} {...props}>
			{children}
		</StyledTag>
	);
}

const StyledTag = styled.span`
    display: inline-block;
    border-radius: var(--border-radius-2xs);
    font-weight: 500;
    ${({ $variant }) => variants[$variant] || variants.primary}
    ${({ $size }) => sizes[$size] || sizes.m}
    line-height: 1;
    white-space: nowrap;
    cursor: default;
`;
