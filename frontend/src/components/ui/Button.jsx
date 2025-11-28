import React from 'react';
import styled, { css } from 'styled-components';

const Button = ({
	                children,
	                variant = 'primary',
	                size = 'm',
	                disabled = false,
	                ...props
                }) => {
	return (
		<StyledButton
			$variant={variant}
			size={size}
			disabled={disabled}
			{...props}
		>
			{children}
		</StyledButton>
	);
};

export default Button;

/* ---------------------- Sizes ---------------------- */
const sizes = {
	s: css`
		font-size: var(--font-size-s);
		padding: var(--spacing-xs) var(--spacing-s);
		border-radius: var(--border-radius-2xs);
		min-width: calc(var(--spacing-xs) + var(--spacing-l) + 2px);
		min-height: calc(var(--spacing-xs) + var(--spacing-l) + 2px);
	`,
	m: css`
		font-size: var(--font-size);
		padding: var(--spacing-s) var(--spacing);
		border-radius: var(--border-radius-xs);
		min-width: calc(var(--spacing-xs) + var(--spacing-xl) + 2px);
		min-height: calc(var(--spacing-xs) + var(--spacing-xl) + 2px);
	`,
	l: css`
		font-size: var(--font-size-l);
		padding: var(--spacing) var(--spacing-l);
		border-radius: var(--border-radius-s);
		min-width: calc(var(--spacing) + var(--spacing-2xl) + 2px);
		min-height: calc(var(--spacing) + var(--spacing-2xl) + 2px);
	`,
};

/* ---------------------- Variants (with disabled built-in) ---------------------- */
const variants = {
	primary: css`
		background-color: var(--color-primary-bg);
		color: var(--color-primary-text);
		border: 1px solid transparent;

		&:hover:not(:disabled) {
			background-color: var(--color-primary-bg-hover);
		}

		&:disabled {
			background-color: var(--color-primary-muted);
			color: var(--color-primary-muted-text);
			border-color: var(--color-primary-muted);
			cursor: not-allowed;
			opacity: 0.7;
		}

		&:focus-visible {
			outline: 3px solid var(--color-primary-bg);
			outline-offset: 2px;
		}
	`,

	secondary: css`
		background-color: var(--color-background-surface-3);
		color: var(--color-primary-bg);
		border: 1px solid transparent;

		&:hover:not(:disabled) {
			background-color: var(--color-primary-bg-hover);
			border-color: var(--color-primary-bg-hover);
			color: var(--color-primary-text);
		}

		&:disabled {
			background-color: var(--color-secondary-muted);
			color: var(--color-secondary-muted-text);
			border-color: var(--color-secondary-muted);
			cursor: not-allowed;
			opacity: 0.7;
		}

		&:focus-visible {
			outline: 3px solid var(--color-primary-bg);
			outline-offset: 2px;
		}
	`,

	outline: css`
		background-color: transparent;
		color: var(--color-primary-bg);
		border: 1px solid var(--color-primary-bg);

		&:hover:not(:disabled) {
			background-color: var(--color-primary-bg);
			color: var(--color-primary-text);
		}

		&:disabled {
			background-color: transparent;
			color: var(--slate-600);
			border-color: var(--slate-700);
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:focus-visible {
			outline: 3px solid var(--color-primary-bg);
			outline-offset: 2px;
		}
	`,

	ghost: css`
		background-color: transparent;
		color: var(--color-text);
		border: 1px solid transparent;
		padding: 0;

		&:hover:not(:disabled) {
			background-color: transparent;
			color: var(--color-primary-bg);
		}

		&:disabled {
			color: var(--slate-600);
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:focus-visible {
			outline: 3px solid var(--slate-700);
			outline-offset: 2px;
		}
	`,

	destructive: css`
		background-color: var(--color-error-bg);
		color: var(--color-error-text);
		border: 1px solid transparent;

		&:hover:not(:disabled) {
			background-color: var(--color-error-bg-hover);
		}

		&:disabled {
			background-color: var(--color-error-muted);
			color: var(--color-error-muted-text);
			border-color: var(--color-error-muted);
			cursor: not-allowed;
			opacity: 0.7;
		}

		&:focus-visible {
			outline: 3px solid var(--color-error-bg);
			outline-offset: 2px;
		}
	`,

	success: css`
		background-color: var(--color-success-bg);
		color: var(--color-success-text);
		border: 1px solid transparent;

		&:hover:not(:disabled) {
			background-color: var(--color-success-bg-hover);
		}

		&:disabled {
			background-color: var(--color-success-muted);
			color: var(--color-success-muted-text);
			border-color: var(--color-success-muted);
			cursor: not-allowed;
			opacity: 0.7;
		}

		&:focus-visible {
			outline: 3px solid var(--color-success-bg);
			outline-offset: 2px;
		}
	`,

	link: css`
		background: none;
		border: none;
		padding: 0;
		color: var(--color-primary-bg);

		&:hover:not(:disabled) {
			color: var(--color-primary-bg-hover);
		}

		&:disabled {
			color: var(--slate-600);
			cursor: not-allowed;
			opacity: 0.5;
			text-decoration: none;
		}

		&:focus-visible {
			outline: 3px solid var(--color-primary-bg);
			outline-offset: 2px;
		}
	`,
};

/* ---------------------- Styled Button ---------------------- */
const StyledButton = styled.button`
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.15s ease;
    user-select: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-decoration: none;
    gap: var(--spacing-s, 0.25rem);

    ${({ size }) => sizes[size] || sizes.m}
    ${({ $variant }) => variants[$variant] || variants.primary}

    &:focus:not(:focus-visible) {
        outline: none;
    }
`;
