import React from "react";
import styled from "styled-components";

export default function ToggleSwitch({
										 checked,
										 onChange,
										 onLabel = "Active",
										 offLabel = "Inactive",
										 disabled = false,
										 id,
										 onColor = "#22c55e",
										 offColor = "#e5e7eb",
									 }) {
	const switchId = id || `switch-${Math.random().toString(36).slice(2)}`;

	return (
		<Wrap $disabled={disabled}>
			<Text $checked={checked} $onColor={onColor} $offColor={offColor}>{checked ? onLabel : offLabel}</Text>

			<Label htmlFor={switchId}>
				<HiddenCheckbox
					id={switchId}
					type="checkbox"
					role="switch"
					aria-checked={checked}
					disabled={disabled}
					checked={checked}
					onChange={(e) => !disabled && onChange?.(e.target.checked)}
				/>
				<Track $onColor={onColor} $offColor={offColor}>
					<Thumb />
				</Track>
			</Label>
		</Wrap>
	);
}

const Wrap = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    opacity: ${(p) => (p.$disabled ? 0.6 : 1)};
    cursor: ${(p) => (p.$disabled ? "not-allowed" : "default")};
`;

const Text = styled.span`
    font-size: var(--font-size-s);
	font-weight: 500;
    user-select: none;
    color: ${({ $checked, $onColor, $offColor }) => ($checked ? $onColor : $offColor)};
`;

const Label = styled.label`
    display: inline-flex;
    align-items: center;
    position: relative;
`;

const HiddenCheckbox = styled.input`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;

    &:focus-visible + span {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.35);
    }
`;

const Track = styled.span`
    width: 44px;
    height: 24px;
    border-radius: 9999px;
    background: ${(p) => p.$offColor};
    position: relative;
    transition: background 0.2s ease;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
    cursor: pointer;

    ${HiddenCheckbox}:checked + & {
        background: ${(p) => p.$onColor};
    }
`;

const Thumb = styled.span`
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: #fff;
    transition: transform 0.2s ease;
    transform: translateX(0);

    ${HiddenCheckbox}:checked + ${Track} & {
        transform: translateX(20px);
    }
`;
