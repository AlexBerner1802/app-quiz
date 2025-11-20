// src/components/ui/Input.jsx

import React, { useId } from 'react';
import styled from 'styled-components';

const Input = ({
				   label,
				   type = 'text',
				   value,
				   onChange,
				   placeholder = '',
				   width = '100%',
				   height = 'auto',
				   size = 'm',
				   icon = null,
				   rightIcon = null,
				   onRightIconClick,
				   rightIconColor = 'var(--color-placeholder, #9ca3af)',
				   rightIconHoverColor = 'var(--color-primary-bg, #111)',
				   textAlign,
				   wrapperStyle,
				   inputWrapperStyle,
				   labelStyle,
				   inputStyle,
				   wrapperClassName,
				   labelClassName,
				   inputClassName,
				   ...props
			   }) => {
	const id = useId();

	return (
		<Wrapper style={wrapperStyle} className={wrapperClassName} width={width} height={height}>
			{label && (
				<Label htmlFor={id} style={labelStyle} className={labelClassName}>
					{label}
				</Label>
			)}
			<InputWrapper $size={size} style={inputWrapperStyle}>
				{icon && <IconWrapper $size={size}>{icon}</IconWrapper>}
				<StyledInput
					id={id}
					type={type}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					style={inputStyle}
					className={inputClassName}
					$size={size}
					$textAlign={textAlign}
					$hasValue={!!value}
					$hasIcon={!!icon}
					{...props}
				/>
				{rightIcon && (
					<RightIconWrapper
						$size={size}
						$clickable={!!onRightIconClick}
						$color={rightIconColor}
						$hoverColor={rightIconHoverColor}
						onClick={onRightIconClick}
					>
						{rightIcon}
					</RightIconWrapper>
				)}
			</InputWrapper>
		</Wrapper>
	);
};

export default Input;

// Styled Components

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: ${({ width }) => width};
    height: ${({ height }) => height};
`;

const Label = styled.label`
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 0.25rem;
`;

const InputWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    border: 1px solid var(--color-input-border);
    border-radius: ${({ $size }) =>
            $size === 's' ? 'var(--border-radius-xs)' :
                    $size === 'l' ? 'var(--border-radius-s)' :
                            'var(--border-radius-xs)'};
    background-color: var(--color-input-background);
    transition: color 0.2s, box-shadow 0.2s;
    overflow: hidden;

    &:focus-within {
        border-color: var(--color-input-focus-border);
        box-shadow: 0 0 0 3px var(--color-primary-muted);
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    padding-left: ${({ $size }) =>
            $size === "s" ? "var(--spacing-xs)" :
                    $size === "l" ? "var(--spacing)" :
                            "var(--spacing-s)"};

    svg {
        width: ${({ $size }) =>
			$size === 's' ? 'var(--font-size)' :
				$size === 'l' ? 'var(--font-size-xl)' :
					'var(--font-size-l)'};
        height: ${({ $size }) =>
			$size === 's' ? 'var(--font-size)' :
				$size === 'l' ? 'var(--font-size-xl)' :
					'var(--font-size-l)'};
    }
`;

const RightIconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 0.5rem;
    color: ${({ $color }) => $color};
    cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
    transition: color 0.2s ease, opacity 0.2s ease;

    &:hover {
        color: ${({ $hoverColor }) => $hoverColor};
        opacity: 1;
    }

    svg {
        width: ${({ $size }) => ($size === 's' ? '1rem' : $size === 'l' ? '1.5rem' : '1.25rem')};
        height: ${({ $size }) => ($size === 's' ? '1rem' : $size === 'l' ? '1.5rem' : '1.25rem')};
    }
`;

const StyledInput = styled.input`
    flex: 1;
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    background-color: transparent;
    color: var(--color-input-text);
    border-radius: inherit;
    box-shadow: none;
    transition: color 0.2s, box-shadow 0.2s;

    padding: ${({ $size, $hasIcon }) => {
		if ($size === 's') return $hasIcon ? 'var(--spacing-xs) var(--spacing-xs)' : 'var(--spacing-xs) var(--spacing-s)';
		if ($size === 'l') return $hasIcon ? 'var(--spacing) var(--spacing-l)' : 'var(--spacing) var(--spacing-l)';
		return $hasIcon ? 'var(--spacing-s) var(--spacing) var(--spacing-s) var(--spacing-s)' : 'var(--spacing-s) var(--spacing)';
	}};

    min-height: ${({ $size }) =>
		$size === 's' ? 'var(--spacing-xl)' :
			$size === 'l' ? 'var(--spacing-2xl)' :
				'calc(var(--spacing-xs) + var(--spacing-xl))'};

    font-size: ${({ $size }) =>
		$size === 's' ? 'var(--font-size-s)' :
			$size === 'l' ? 'var(--font-size-l)' :
				'var(--font-size)'};

    text-align: ${({ $textAlign }) => $textAlign || 'left'};

    &::placeholder {
        color: var(--color-input-placeholder);
    }

    &:disabled {
        cursor: not-allowed;
        pointer-events: none;
        background-color: var(--color-input-disabled-background);
        color: var(--color-input-disabled-text);
    }

    &[aria-invalid='true'] {
        border-color: var(--color-error-bg);
        box-shadow: 0 0 0 3px var(--color-error-muted);
    }
`;
