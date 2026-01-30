import React from 'react';
import styled, { css } from 'styled-components';

const Button = ({
	                children,
	                variant = 'primary',
	                size = 'm',
					isIcon = false,
	                disabled = false,
	                ...props
                }) => {
	return (
		<StyledButton
			$variant={variant}
			size={size}
			$isIcon={isIcon}
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
        min-width: var(--input-height-s);
        min-height: var(--input-height-s);
	`,
	m: css`
        font-size: var(--font-size);
        padding: var(--spacing-s) var(--spacing);
        border-radius: var(--border-radius-xs);
        min-width: var(--input-height);
        min-height: var(--input-height);
	`,
	l: css`
        font-size: var(--font-size-l);
        padding: var(--spacing) var(--spacing-l);
        border-radius: var(--border-radius-s);
        min-width: var(--input-height-l);
        min-height: var(--input-height-l);
	`,
};

const iconSizes = {
	s: css`
		width: var(--input-height-s);
		height: var(--input-height-s);
		padding: 0;
	`,
	m: css`
		width: var(--input-height);
		height: var(--input-height);
		padding: 0;
	`,
	l: css`
		width: var(--input-height-l);
		height: var(--input-height-l);
		padding: 0;
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
		background-color: var(--color-input-background);
		color: var(--color-primary-bg);
        border: 1px solid var(--color-input-border);

		&:hover:not(:disabled) {
			background-color: var(--color-primary-bg-hover);
            border-color : var(--color-primary-bg-hover);
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
			pointer-events: none;
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

	icon: css`
		background-color: transparent;
		border: 1px solid transparent;

		&:hover:not(:disabled) {
			background-color: var(--color-background-surface-3);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
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
    transition: all 0.2s ease, box-shadow 0.15s ease;
    user-select: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-decoration: none;
    gap: var(--spacing-s, 0.25rem);

    /* normal sizing */
    ${({ size }) => sizes[size] || sizes.m}

	/* visual variant */
    ${({ $variant }) => variants[$variant] || variants.primary}

	/* icon override */
    ${({ $isIcon, size }) =>
            $isIcon && (iconSizes[size] || iconSizes.m)}

    &:focus:not(:focus-visible) {
        outline: none;
    }
`;

