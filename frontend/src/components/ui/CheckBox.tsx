import React from "react";
import styled from "styled-components";
import { Check } from "lucide-react";

// Props: type="checkbox" | "radio", checked, onChange, disabled, label
export default function CheckBox({
                                     checked = false,
                                     onChange,
                                     disabled = false,
                                     label,
                                     type = "checkbox",
                                     ...props
                                 }) {
    return (
        <Wrapper disabled={disabled} {...props}>
            <HiddenInput
                type={type}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
            />
            <CustomBox checked={checked} disabled={disabled} $type={type}>
                {checked && <Check strokeWidth={3} size={16} color="var(--color-primary-text)" />}
            </CustomBox>
            {label && <LabelText>{label}</LabelText>}
        </Wrapper>
    );
}

const Wrapper = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
    user-select: none;
`;

const HiddenInput = styled.input`
    display: none;
`;

const CustomBox = styled.div`
    width: 20px;
    height: 20px;
    border: ${({ checked }) => (checked ? "2px solid var(--color-primary-bg, #ccc)" : "2px solid var(--color-border, #ccc)")};
    border-radius: ${({ $type }) => ($type === "radio" ? "50%" : "4px")};
    background-color: ${({ checked }) => (checked ? "var(--color-primary-bg, #3b82f6)" : "transparent")};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: var(--color-primary-bg);

    ${Wrapper}:hover & {
        border-color: ${({ disabled }) => (disabled ? "#ccc" : "var(--color-primary-bg, #3b82f6)")};
    }

    &:active {
        transform: scale(0.92);
    }
`;

const LabelText = styled.span`
    font-size: 0.875rem;
    color: var(--color-text);
`;
