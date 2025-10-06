import React, { useId } from 'react';
import styled from 'styled-components';

const Input = ({
                   label,
                   type = 'text',
                   value,
                   onChange,
                   placeholder = '',
                   width = 'fit-content',
                   size = 'm',
                   icon = null,
                   textAlign,
				   wrapperStyle,
				   inputWrapperStyle,
				   inputWrapperBg,
                   labelStyle,
                   inputStyle,
                   wrapperClassName,
                   labelClassName,
                   inputClassName,
                   ...props
               }) => {
    const id = useId();

    return (
        <Wrapper style={wrapperStyle} className={wrapperClassName} width={width}>
            {label && <Label htmlFor={id} style={labelStyle} className={labelClassName}>{label}</Label>}
            <InputWrapper style={inputWrapperStyle} $size={size} $bgColor={inputWrapperBg}>
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
                    {...props}
                />
            </InputWrapper>
        </Wrapper>
    );
};

export default Input;

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: ${({ width }) => width};
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--color-text, #333);
	margin-bottom: var(--spacing-xs);
`;

const InputWrapper = styled.div`
	display: flex;
	width: 100%;
	align-items: center;
	border: 2px solid transparent;
    background-color: ${({ $bgColor }) => $bgColor || "var(--color-background-input, #fff)"};
	color: var(--color-text);
	border-radius: ${({ $size }) =>
    $size === 's' ? '0.25rem' :
        $size === 'l' ? '0.5rem' : '0.375rem'};
	padding: 0;
	transition: all .2s ease-in-out;

	&:focus-within {
		background-color: var(--color-background-input-focused, #fff);
		border-color: var(--color-primary-bg, #2684FF);
	}
`;

const IconWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding-left: 0.5rem;

	svg {
		width: ${({ $size }) =>
    $size === 's' ? '1rem' :
        $size === 'l' ? '1.5rem' : '1.25rem'};
		height: ${({ $size }) =>
    $size === 's' ? '1rem' :
        $size === 'l' ? '1.5rem' : '1.25rem'};
	}
`;

const StyledInput = styled.input`
    border: none;
    background-color: var(--color-background-input, #fff);
    outline: none;
    width: 100%;
    line-height: var(--line-height);
    transition: all 0.2s ease-in-out;

    font-size: ${({ $size }) =>
            $size === 's' ? 'var(--font-size-s)' :
                    $size === 'l' ? 'var(--font-size-l)' : 'var(--font-size)'};

    padding: ${({ $size }) =>
            $size === 's' ? '0.5rem 0.625rem' :
                    $size === 'l' ? '0.9375rem 1.875rem' : '0.75rem 1rem'};

    text-align: ${({ $textAlign }) => $textAlign || 'left'};

    &:focus {
        background-color: var(--color-background-input-focused, #fff);
    }

    &::placeholder {
        color: var(--color-placeholder, #aaa);
    }
`;


