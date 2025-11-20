// src/components/ui/TextArea.jsx

import React, { useId } from "react";
import styled from "styled-components";

export default function TextArea({
									 label,
									 value,
									 onChange,
									 placeholder = "",
									 rows = 3,
									 width = "100%",
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
			<InputWrapper $size={size} $hideFocus={hideFocus} style={inputWrapperStyle}>
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
					$hasIcon={!!icon}
					$hideFocus={hideFocus}
					$resize={resize}
					{...props}
				/>
			</InputWrapper>
		</Wrapper>
	);
}

// Styled Components

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: ${({ width }) => width};
`;

const Label = styled.label`
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 0.25rem;
`;

const InputWrapper = styled.div`
    display: flex;
    align-items: flex-start;
    width: 100%;
    border: 1px solid var(--color-input-border);
    border-radius: ${({ $size }) =>
            $size === 's' ? 'var(--border-radius-s)' :
                    $size === 'l' ? 'var(--border-radius)' :
                            'var(--border-radius)'};
    background-color: var(--color-input-background);
    transition: color 0.2s, box-shadow 0.2s;
    overflow: hidden;

    &:focus-within {
        border-color: ${({ $hideFocus }) =>
                $hideFocus ? "var(--color-input-border)" : "var(--color-input-focus-border)"};
        box-shadow: ${({ $hideFocus }) =>
                $hideFocus ? "none" : "0 0 0 3px var(--color-primary-muted)"};
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
    padding-top: ${({ $size }) =>
            $size === "s" ? "calc(var(--spacing-xs) + 2px)" :
                    $size === "l" ? "calc(var(--spacing) + 2px)" :
                            "calc(var(--spacing-s) + 2px)"};

    svg {
        width: ${({ $size }) =>
                $size === "s" ? "var(--font-size)" :
                        $size === "l" ? "var(--font-size-xl)" :
                                "var(--font-size-l)"};
        height: ${({ $size }) =>
                $size === "s" ? "var(--font-size)" :
                        $size === "l" ? "var(--font-size-xl)" :
                                "var(--font-size-l)"};
    }
`;

const StyledTextArea = styled.textarea`
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
    font: inherit;
    line-height: var(--line-height-xl);
	
    padding: ${({ $size, $hasIcon }) => {
        if ($size === "s") return $hasIcon ? "var(--spacing-xs) var(--spacing-xs)" : "var(--spacing-xs) var(--spacing-s)";
        if ($size === "l") return $hasIcon ? "var(--spacing) var(--spacing-l)" : "var(--spacing) var(--spacing-l)";
        return $hasIcon ? "var(--spacing-s) var(--spacing) var(--spacing-s) var(--spacing-s)" : "var(--spacing-s) var(--spacing)";
    }};
	
    font-size: ${({ $size }) =>
            $size === "s" ? "var(--font-size-s)" :
                    $size === "l" ? "var(--font-size-l)" :
                            "var(--font-size)"};
	
    text-align: ${({ $textAlign }) => $textAlign || "left"};
    resize: ${({ $resize }) => $resize || "vertical"};

    &::placeholder {
        color: var(--color-input-placeholder);
    }

    &:disabled {
        cursor: not-allowed;
        pointer-events: none;
        background-color: var(--color-input-disabled-background);
        color: var(--color-input-disabled-text);
    }
`;
