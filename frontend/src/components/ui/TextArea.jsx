import React, { useId } from "react";
import styled from "styled-components";

export default function TextArea({
									 label,
									 value,
									 onChange,
									 placeholder = "",
									 rows = 3,
									 width = "fit-content",
									 size = "m",
									 icon = null,
									 textAlign,
									 wrapperStyle,
									 inputWrapperStyle,
									 labelStyle,
									 inputStyle,
									 wrapperClassName,
									 labelClassName,
									 inputClassName,
									 resize = "none",
									 hideFocus = false,
									 ...props
								 }) {
	const id = useId();

	return (
		<Wrapper style={wrapperStyle} className={wrapperClassName} width={width}>
			{label && (
				<Label htmlFor={id} style={labelStyle} className={labelClassName}>
					{label}
				</Label>
			)}
			<InputWrapper
				style={inputWrapperStyle}
				$size={size}
				$hideFocus={hideFocus}
			>
				{icon && <IconWrapper $size={size}>{icon}</IconWrapper>}
				<StyledTextArea
					id={id}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					rows={rows}
					style={inputStyle}
					className={inputClassName}
					$size={size}
					$textAlign={textAlign}
					$resize={resize}
					$hideFocus={hideFocus}
					{...props}
				/>
			</InputWrapper>
		</Wrapper>
	);
}

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
    align-items: flex-start;
    overflow: hidden;
    border: 1px solid var(--color-border);
    background-color: var(--color-background-input, #fff);
    color: var(--color-text);
    border-radius: var(--border-radius);
    padding: 0;
    transition: all 0.2s ease-in-out;

    &:focus-within {
        ${({ $hideFocus }) =>
                $hideFocus
                        ? `
			border-color: var(--color-border);
			background-color: var(--color-background-input, #fff);
		`
                        : `
			border-color: var(--color-primary-bg, #2684FF);
			background-color: var(--color-background-input-focused, #fff);
		`}
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: var(--spacing);
    padding-top: var(--spacing);
`;

const StyledTextArea = styled.textarea`
    border: none;
    background-color: transparent;
    outline: none;
    width: 100%;
    font: inherit;
    line-height: var(--line-height-xl);
    transition: all 0.2s ease-in-out;

    font-size: ${({ $size }) =>
            $size === "s"
                    ? "var(--font-size-s)"
                    : $size === "l"
                            ? "var(--font-size-l)"
                            : "var(--font-size)"};

    padding: ${({ $size }) =>
            $size === "s"
                    ? "0.5rem 0.625rem"
                    : $size === "l"
                            ? "0.9375rem 1.875rem"
                            : "0.75rem 1rem"};

    text-align: ${({ $textAlign }) => $textAlign || "left"};
    resize: ${({ $resize }) => $resize || "vertical"};
	
    &::placeholder {
        color: var(--color-placeholder, #aaa);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
        -webkit-text-fill-color: var(--color-text, #333) !important;
        transition: background-color 0.2s ease-in-out 0s;
    }
`;