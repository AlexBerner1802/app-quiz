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

/* ---------------------- Variants ---------------------- */
const variants = {
	/* Primary button — main CTA */
	primary: css`
		background-color: var(--color-primary-bg);
		color: var(--color-primary-text);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  	background-color: var(--color-primary-bg-hover);
            border: 1px solid transparent;
		}
	
		&:focus-visible {
		  	outline: 3px solid var(--color-primary-bg);
            outline-offset: 2px;
		}
  `,

	/* Secondary button */
	secondary: css`
		background-color: var(--color-background-surface-3);
		color: var(--color-primary-bg);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  	background-color: var(--color-primary-bg-hover);
            border-color: var(--color-primary-bg-hover);
            color: var(--color-primary-text);
		}
	
		&:focus-visible {
		  	outline: 3px solid var(--color-primary-bg);
            outline-offset: 2px;
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
            outline-offset: 2px;
		}
  `,

	/* Ghost button — no border, subtle */
	ghost: css`
		background-color: transparent;
        color: var(--color-text);
		border: 1px solid transparent;
        box-shadow: none;
        padding: 0;

        &:hover:not(:disabled) {
            background-color: transparent;
            color: var(--color-primary-bg);

            & svg {
                transition: all 0.2s ease;
                stroke: var(--color-primary-bg);
            }
        }
	
		&:focus-visible {
		  outline: 3px solid var(--slate-700);
            outline-offset: 2px;
		}
  `,

	/* Destructive — red actions */
	destructive: css`
		background-color: var(--color-error-bg);
		color: var(--color-error-text);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  background-color: var(--color-error-bg-hover);
		  border-color: var(--color-error-bg-hover);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-error-bg);
            outline-offset: 2px;
		}
  `,

	/* Success — green confirmation */
	success: css`
		background-color: var(--color-success-bg);
		color: var(--color-success-text);
		border: 1px solid transparent;
	
		&:hover:not(:disabled) {
		  background-color: var(--color-success-bg-hover);
            border-color: var(--color-success-bg-hover);
		}
	
		&:focus-visible {
		  outline: 3px solid var(--color-success-bg);
            outline-offset: 2px;
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
            outline-offset: 2px;
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
    gap: var(--spacing-s, 0.25rem);

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
