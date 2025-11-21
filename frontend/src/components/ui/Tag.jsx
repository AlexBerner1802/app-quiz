import React from "react";
import styled, { css } from "styled-components";

const variants = {
	primary: css`
        background-color: var(--color-primary-bg);
        color: var(--color-primary-text);
        border: 1px solid transparent;

        ${({ $clickable }) =>
                $clickable &&
                css`
                &:hover {
                    background-color: var(--color-primary-bg-hover);
                }
            `}
	`,
	secondary: css`
        background-color: var(--color-background-surface-3);
        color: var(--color-primary-bg);
        border: 1px solid transparent;

        ${({ $clickable }) =>
                $clickable &&
                css`
                &:hover {
                    background-color: var(--color-primary-bg-hover);
                    color: var(--color-primary-text);
                }
            `}
	`,
	outline: css`
        background-color: transparent;
        color: var(--color-primary-bg);
        border: 1px solid var(--color-primary-bg);

        ${({ $clickable }) =>
                $clickable &&
                css`
                &:hover {
                    background-color: var(--color-primary-bg);
                    color: var(--color-primary-text);
                    border-color: var(--color-primary-bg);
                }
            `}
	`,
	ghost: css`
        background-color: transparent;
        color: var(--color-text);
        border: 1px solid transparent;

        ${({ $clickable }) =>
                $clickable &&
                css`
                &:hover {
                    color: var(--color-primary-bg);
                }
            `}
	`,
	destructive: css`
        background-color: var(--color-error-bg);
        color: var(--color-error-text);
        border: 1px solid transparent;

        ${({ $clickable }) =>
                $clickable &&
                css`
                &:hover {
                    background-color: var(--color-error-bg-hover);
                }
            `}
	`,
	success: css`
        background-color: var(--color-success-bg);
        color: var(--color-success-text);
        border: 1px solid transparent;

        ${({ $clickable }) =>
                $clickable &&
                css`
                &:hover {
                    background-color: var(--color-success-bg-hover);
                }
            `}
	`,
	link: css`
        background: none;
        border: none;
        color: var(--color-primary-bg);
        padding: 0;
        height: auto;

        ${({ $clickable }) =>
                $clickable &&
                css`
                &:hover {
                    color: var(--color-primary-bg-hover);
                }
            `}
	`,
};


const sizes = {
	s: css`
        font-size: var(--font-size-xs);
        font-weight: 500;
        padding: var(--spacing-2xs) var(--spacing-xs);
        border-radius: var(--border-radius-2xs);
	`,
	m: css`
        font-size: var(--font-size-s);
        font-weight: 500;
        padding: var(--spacing-xs) var(--spacing-s);
        border-radius: var(--border-radius-2xs);
	`,
	l: css`
        font-size: var(--font-size);
        font-weight: 500;
        padding: var(--spacing-s) var(--spacing);
        border-radius: var(--border-radius-2xs);
	`,
};

export default function Tag({
								children,
								variant = "primary",
								size = "m",
								clickable = false,
								...props
							}) {
	return (
		<StyledTag $variant={variant} $size={size} $clickable={clickable} {...props}>
			{children}
		</StyledTag>
	);
}

const StyledTag = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    transition: all 0.2s ease;

    cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

    ${({ $variant }) => variants[$variant] || variants.primary}

    ${({ $size }) => sizes[$size] || sizes.m}

    ${({ $clickable }) =>
            $clickable &&
            css`
      &:active {
        transform: scale(0.95);
        opacity: 0.85;
      }
    `}
`;
