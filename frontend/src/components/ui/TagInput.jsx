import React from "react";
import styled from "styled-components";
import Tag from "./Tag";

const TagInput = ({
	                  lang,
	                  tags = [],
	                  inputValue = "",
	                  onInputChange,
	                  onKeyDown,
	                  onRemoveTag,
	                  placeholder = "Type and press Enter or comma",
                  }) => {

	return (
		<div>
			<TagInputContainer onClick={() => document.getElementById(`input-${lang}`).focus()}>
				{tags.length > 0 &&
					tags.map((tag, index) => {
						// Ensure tag is always an object
						const tagObj = typeof tag === "string" ? { id: null, name: tag } : tag;
						return (
							<Tag
								key={tagObj.id ?? `new-${tagObj.name}-${index}`}
								variant="primary"
								size="m"
								clickable
								canDelete
								onDelete={() => onRemoveTag(tagObj, true)}
							>
								{tagObj.name}
							</Tag>
						);
					})}
				<Input
					id={`input-${lang}`}
					value={inputValue}
					onChange={(e) => onInputChange(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder={placeholder}
				/>
			</TagInputContainer>
		</div>
	);
};

export default TagInput;

const TagInputContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-xs);
	padding: var(--spacing-s);
    border: 1px solid var(--color-input-border);
	border-radius: var(--border-radius-xs);
	background-color: var(--color-input-background);
    transition: all 0.2s;
	cursor: text;

    &:focus-within {
        border-color: var(--color-input-focus-border);
        box-shadow: 0 0 0 3px var(--color-primary-muted);
    }
`;

const Input = styled.input`
	flex: 1;
	border: none;
	outline: none;
	min-width: 120px;
	font-size: 14px;
	padding: var(--spacing-s) 0;
	background-color: transparent;
	margin-left: var(--spacing-2xs);
`;
