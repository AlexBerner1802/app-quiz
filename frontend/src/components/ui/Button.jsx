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
		<StyledButton $variant={variant} size={size} disabled={disabled} {...props}>
			{children}
		</StyledButton>
	);
};

export default Button;


/* ---------------------- Sizes ---------------------- */
const sizes = {
	xs: css`
        font-size: 0.75rem;
        padding: 0.375rem 0.5rem;
        border-radius: 0.25rem;
	`,
	s: css`
        font-size: 0.875rem;
        padding: 0.5rem 0.625rem;
        border-radius: 0.375rem;
	`,
	m: css`
        font-size: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
	`,
	l: css`
        font-size: 1.25rem;
        padding: 0.9375rem 1.875rem;
        border-radius: 0.675rem;
	`,
	xl: css`
        font-size: 1.5rem;
        padding: 1.125rem 2.5rem;
        border-radius: 0.75rem;
	`,
};

/* ---------------------- Variants ---------------------- */
const variants = {
	/* Primary button — main CTA */
	primary: css`
		background-color: var(--color-primary-bg);
		color: var(--color-primary-text);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  background-color: var(--color-primary-bg-hover);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-primary-bg);
		}
  `,

	/* Secondary button */
	secondary: css`
		background-color: var(--color-background-surface-3);
		color: var(--color-primary-bg);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  background-color: var(--color-primary-bg-hover);
            color: var(--color-primary-text);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-primary-bg);
		}
  `,

	/* Outline button — bordered, minimal background */
	outline: css`
		background-color: transparent;
		color: var(--color-primary-bg);
		border: 1px solid var(--color-primary-bg);
	
		&:hover:not(:disabled) {
            color: var(--color-primary-text);
		  	background-color: var(--color-primary-bg);
		  	border-color: var(--color-primary-bg);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-primary-bg);
		}
  `,

	/* Ghost button — no border, subtle */
	ghost: css`
		background-color: transparent;
		color: var(--slate-50);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  background-color: var(--slate-800);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--slate-700);
		}
  `,

	/* Destructive — red actions */
	destructive: css`
		background-color: var(--color-error-bg);
		color: var(--color-error-text);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  background-color: var(--color-error-bg-hover);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-error-bg);
		}
  `,

	/* Success — green confirmation */
	success: css`
		background-color: var(--color-success-bg);
		color: var(--color-success-text);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  background-color: var(--color-success-bg-hover);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-success-bg);
		}
  `,

	/* Link button — no padding, acts like a text link */
	link: css`
		background: none;
		border: none;
		color: var(--color-primary-bg);
		padding: 0;
		height: auto;
	
		&:hover:not(:disabled) {
            background: none;
		  	color: var(--color-primary-bg-hover);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-primary-bg);
		}
  `,
};

/* ---------------------- Disabled ---------------------- */
const disabledStyles = {
	primary: css`
    background-color: var(--color-primary-muted);
    color: var(--color-primary-muted-text);
    border-color: var(--color-primary-muted);
    cursor: not-allowed;
    opacity: 0.7;
  `,

	secondary: css`
    background-color: var(--color-secondary-muted);
    color: var(--color-secondary-muted-text);
    border-color: var(--color-secondary-muted);
    cursor: not-allowed;
    opacity: 0.7;
  `,

	success: css`
    background-color: var(--color-success-muted);
    color: var(--color-success-muted-text);
    border-color: var(--color-success-muted);
    cursor: not-allowed;
    opacity: 0.7;
  `,

	destructive: css`
    background-color: var(--color-error-muted);
    color: var(--color-error-muted-text);
    border-color: var(--color-error-muted);
    cursor: not-allowed;
    opacity: 0.7;
  `,

	outline: css`
    background-color: transparent;
    color: var(--slate-600);
    border-color: var(--slate-700);
    cursor: not-allowed;
    opacity: 0.5;
  `,

	ghost: css`
    background-color: transparent;
    color: var(--slate-600);
    border-color: transparent;
    cursor: not-allowed;
    opacity: 0.5;
  `,

	link: css`
    background: none;
    border: none;
    color: var(--slate-600);
    cursor: not-allowed;
    opacity: 0.5;
    text-decoration: none;
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
    line-height: var(--line-height, 1.2);
    gap: var(--spacing-xs, 0.25rem);

    /* Size */
    ${({ size }) => sizes[size] || sizes.m}

        /* Variant */
    ${({ $variant }) => variants[$variant] || variants.primary}

        /* Disabled */
    ${({ disabled }) => disabled && disabledStyles}

    &:focus:not(:focus-visible) {
        outline: none;
    }
`;
