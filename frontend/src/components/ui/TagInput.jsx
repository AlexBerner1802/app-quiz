import React from "react";
import styled from "styled-components";
import Tag from "./Tag";


const TagInput = ({
	                  lang,
	                  tempTags = [],
	                  tags = [],
	                  inputValue = "",
	                  onInputChange,
	                  onKeyDown,
	                  onAddTags,
	                  onRemoveTag,
                  }) => {
	return (
		<>
			<TagInputContainer onClick={() => document.getElementById(`input-${lang}`).focus()}>
				{tempTags.length > 0 && tempTags.map(tag => (
					<Tag
						key={tag}
						variant="primary"
						size="m"
						clickable
					>
						{tag}
						<DeleteButton onClick={() => onRemoveTag(tag, true)}>×</DeleteButton>
					</Tag>
				))}
				<Input
					id={`input-${lang}`}
					value={inputValue}
					onChange={e => onInputChange(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder="Type and press Enter or comma"
				/>
			</TagInputContainer>
			<AddButton onClick={onAddTags}>Add Tags</AddButton>
			<TagInputContainer style={{ marginTop: "8px" }}>
				{tags.length > 0 && tags.map(tag => (
					<Tag
						key={tag.id ?? `new-${tag.name}`}
						variant="primary"
						size="m"
						clickable
					>
						{tag.name}
						<DeleteButton onClick={() => onRemoveTag(tag)}>×</DeleteButton>
					</Tag>
				))}
			</TagInputContainer>
		</>
	);
};

export default TagInput;


const TagInputContainer = styled.div`  
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-s);
	padding: var(--spacing-s) var(--spacing);
	border: 1px solid var(--color-border);
	border-radius: var(--border-radius-xs);
	cursor: text;
`;

const DeleteButton = styled.button`  
	background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  &:hover { color: #d00; }
`;

const Input = styled.input`  
	flex: 1;
	border: none;
	outline: none;
	min-width: 120px;
	font-size: 14px;
	padding: 4px 0;
`;

const AddButton = styled.button`  
	padding: 6px 12px;
  margin-top: 6px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  &:hover { background: #0069d9; }
`;
