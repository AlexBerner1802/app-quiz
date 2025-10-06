import React, { useId } from "react";
import styled from "styled-components";
import { Edit3 } from "lucide-react"; // optional icon

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
									 resize="none",
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
			<InputWrapper style={inputWrapperStyle} $size={size}>
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
    background-color: var(--color-background-input, #fff);
    color: var(--color-text);
    border-radius: ${({ $size }) =>
	$size === "s" ? "0.25rem" :
		$size === "l" ? "0.5rem" : "0.375rem"};
    padding: 0;
    transition: all 0.2s ease-in-out;
	resize: ${({ $resize }) => $resize};

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
	$size === "s" ? "1rem" :
		$size === "l" ? "1.5rem" : "1.25rem"};
        height: ${({ $size }) =>
	$size === "s" ? "1rem" :
		$size === "l" ? "1.5rem" : "1.25rem"};
    }
`;

const StyledTextArea = styled.textarea`
    border: none;
    background-color: var(--color-background-input, #fff);
    outline: none;
    width: 100%;
    font: inherit;
    line-height: var(--line-height);
    transition: all 0.2s ease-in-out;

    font-size: ${({ $size }) =>
            $size === "s" ? "var(--font-size-s)" :
                    $size === "l" ? "var(--font-size-l)" : "var(--font-size)"};

    padding: ${({ $size }) =>
            $size === "s" ? "0.5rem 0.625rem" :
                    $size === "l" ? "0.9375rem 1.875rem" : "0.75rem 1rem"};

    text-align: ${({ $textAlign }) => $textAlign || "left"};

    resize: ${({ $resize }) => $resize || "vertical"};  /* ✅ Apply here */

    &:focus {
        background-color: var(--color-background-input-focused, #fff);
    }

    &::placeholder {
        color: var(--color-placeholder, #aaa);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
