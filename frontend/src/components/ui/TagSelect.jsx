// TagSelect.jsx
import React, { useState, useId, useRef } from "react";
import { X } from "lucide-react";
import styled from "styled-components";

const TagSelect = ({
					  label,
					  suggestions = [], // Array of objects: { id, label }
					  value = [],
					  onChange,
					  placeholder = "Ajouter un tag...",
					  prefixAdd = "Ajouter ",
					  allowNew = true,
					  width = "fit-content",
					  height = "fit-content",
					  wrapperStyle,
					  labelStyle,
					  inputStyle,
					  wrapperClassName,
					  labelClassName,
					  inputClassName,
				  }) => {

	const [inputValue, setInputValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);
	const id = useId();

	const filteredSuggestions = (Array.isArray(suggestions) ? suggestions : [])
		.filter(
			(s) =>
				s?.label &&
				!value.some(
					(t) =>
						String(t?.id) === String(s?.id) || (t?.label?.toLowerCase() === s?.label?.toLowerCase())
				)
		)
		.filter((s) =>
			inputValue
				? s?.label?.toLowerCase().includes(inputValue.toLowerCase())
				: true
		);

	const addTag = (tag) => {
		if (!tag) return;
		const exists = value.some((t) => String(t.id) === String(tag.id));
		if (!exists) onChange([...value, tag]);
		setInputValue("");
		setIsOpen(false);
	};

	const removeTag = (tag) => {
		onChange?.(value.filter((t) => t?.id !== tag.id));
	};

	const onValidateInput = () => {
		const raw = inputValue.trim();
		if (!raw) return;

		const existing = filteredSuggestions.find(
			(s) => s?.label.toLowerCase() === raw.toLowerCase()
		);

		if (existing) {
			addTag(existing);
			return;
		}

		if (allowNew) {
			addTag({ id: `new-${Date.now()}`, label: raw });
		}
	};

	React.useEffect(() => {
		const handleClickOutside = (event) => {
			if (containerRef.current && !containerRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<Wrapper style={wrapperStyle} className={wrapperClassName} width={width} ref={containerRef}>
			{label && <Label style={labelStyle} className={labelClassName}>{label}</Label>}

			<TagContainer height={height}>
				{value.map((tag) =>
					tag && tag.label ? (
						<Tag key={tag.id}>
							{tag.label}
							<RemoveButton onClick={() => removeTag(tag)}>
								<X size={16} />
							</RemoveButton>
						</Tag>
					) : null
				)}

				<StyledInput
					id={id}
					value={inputValue}
					onFocus={() => setIsOpen(true)}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === "Tab") {
							e.preventDefault();
							onValidateInput();
						}
						if (e.key === "ArrowDown") setIsOpen(true);
					}}
					placeholder={placeholder}
					style={inputStyle}
					className={inputClassName}
				/>
			</TagContainer>

			{isOpen && filteredSuggestions.length > 0 && (
				<Dropdown>
					{filteredSuggestions.map(
						(s) =>
							s && (
								<DropdownItem key={s.id} onClick={() => addTag(s)}>
									{s.label}
								</DropdownItem>
							)
					)}

					{allowNew &&
						inputValue &&
						!filteredSuggestions.some(
							(s) => s.label.toLowerCase() === inputValue.trim().toLowerCase()
						) && (
							<DropdownItem key={`new-${inputValue}`} onClick={onValidateInput}>
								{prefixAdd}"{inputValue}"
							</DropdownItem>
						)}
				</Dropdown>
			)}
		</Wrapper>
	);
};

export default TagSelect;


/* ---------------- styled components ---------------- */

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    width: ${({ width }) => width};
`;

const Label = styled.label`
    font-size: var(--font-size);
    font-weight: 500;
    margin-bottom: var(--spacing, 0.25rem);
    color: var(--color-text, #333);
`;

const TagContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs, 0.25rem);
    border-radius: var(--border-radius-xs);
    padding: 0.5rem;
    background: var(--color-input-background, #fff);
    border: 1px solid var(--color-input-border, #ccc);
    height: ${({ height }) => height};
    min-height: 46px;

    &:focus-within {
        border-color: var(--color-primary-bg, #2684ff);
    }
`;

const Tag = styled.div`
    display: flex;
    align-items: center;
    background: var(--color-primary-muted, #2684ff);
    border: 1px solid var(--color-primary-bg, #2684ff);
    color: var(--color-primary-bg, #333);
    border-radius: var(--border-radius-xs);
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    gap: 0.25rem;
`;

const RemoveButton = styled.div`
    background: none;
    border: none;
    color: var(--color-primary-bg, #333);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const StyledInput = styled.input`
    border: none;
    outline: none;
    flex: 1;
    min-width: 120px;
    background: transparent;

    &::placeholder {
        color: var(--color-text-muted, #aaa);
    }
`;

const Dropdown = styled.ul`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 0.25rem 0 0;
    padding: 0;
    list-style: none;
    background: var(--color-input-background, #fff);
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--border-radius-xs);
    max-height: 150px;
    overflow-y: auto;
    z-index: 1000;
`;

const DropdownItem = styled.li`
    height: 40px;
    line-height: 40px;
    padding: 0 0.5rem;
    cursor: pointer;
    &:hover {
        background: var(--color-primary-bg, #f0f0f0);
        color: var(--color-primary-text);
    }
`;
