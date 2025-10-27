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
    font-size: var(--font-size);
	font-weight: 500;
	color: var(--color-text, #333);
	margin-bottom: var(--spacing-xs);
`;

const InputWrapper = styled.div`
	display: flex;
	width: 100%;
	align-items: center;
	overflow: hidden;
	border: 1px solid var(--color-border);
    background-color: ${({ $bgColor }) => $bgColor || "var(--color-background-input, #fff)"};
	color: var(--color-text);
    border-radius: var(--border-radius);
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
	padding-left: var(--spacing);

`;

const StyledInput = styled.input`
    border: none;
    background-color: transparent!important;
    outline: none;
    width: 100%;
    line-height: var(--line-height-l);
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

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
        -webkit-text-fill-color: var(--color-text, #333) !important;
        transition: background-color 5000s ease-in-out 0s;
    }

`;


