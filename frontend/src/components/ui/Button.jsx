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


const sizes = {
	xs: css`
    font-size: 0.75rem; /* 12px */
    padding: 0.375rem 0.5rem; /* 6px 8px */
    border-radius: 0.25rem; /* 4px */
  `,
	s: css`
    font-size: 0.875rem; /* 14px */
    padding: 0.5rem 0.625rem; /* 8px 10px */
    border-radius: 0.375rem; /* 6px */
  `,
	m: css`
    font-size: 1rem; /* 16px */
    padding: 0.75rem 1rem; /* 12px 16px */
    border-radius: 0.5rem; /* 8px */
  `,
	l: css`
    font-size: 1.25rem; /* 20px */
    padding: 0.9375rem 1.875rem; /* 15px 30px */
    border-radius: 0.675rem; /* 12px */
  `,
	xl: css`
    font-size: 1.5rem; /* 24px */
    padding: 1.125rem 2.5rem; /* 18px 40px */
    border-radius: 0.75rem; /* 16px */
  `,
};

const variants = {
	primary: css`
    background-color: var(--color-primary-bg);
    color: var(--color-btn-text);
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background-color: var(--color-primary-bg-hover);
    }

    &:focus-visible {
      outline: 3px solid var(--color-primary-bg-hover);
      outline-offset: 2px;
    }
  `,

	secondary: css`
    background-color: var(--color-background-elevated);
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover:not(:disabled) {
        background-color: var(--color-primary-bg-hover);
		border-color: var(--color-primary-bg);
    }

    &:focus-visible {
        outline: 3px solid var(--gray-500);
        outline-offset: 2px;
    }
  `,
};

const disabledStyles = css`
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  background-color: var(--gray-200);
  color: var(--gray-500);
  border-color: var(--gray-300);
`;

const StyledButton = styled.button`
	font-family: inherit;
	font-weight: 500;
	border: none;
	cursor: pointer;
	transition: background-color 0.2s ease, box-shadow 0.15s ease;
	user-select: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	text-decoration: none;
	line-height: var(--line-height);
	will-change: transform;
	outline-offset: 2px;
	gap: var(--spacing-xs);
	
	/* Size */
	${({ size }) => sizes[size] || sizes.m}
	
	/* Variant */
	${({ $variant }) => variants[$variant] || variants.primary}
	
	/* Disabled */
	${({ disabled }) => disabled && disabledStyles}
	
	/* Remove blue highlight on mobile tap */
	&:focus:not(:focus-visible) {
		outline: none;
	}
`;
