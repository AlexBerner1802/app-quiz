import React from "react";
import styled from "styled-components";

const TagInputContainer = styled.div`  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: text;`;

const TagBubble = styled.div`  background: #d1e7ff;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;`;

const DeleteButton = styled.button`  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  &:hover { color: #d00; }`;

const Input = styled.input`  flex: 1;
  border: none;
  outline: none;
  min-width: 120px;
  font-size: 14px;
  padding: 4px 0;`;

const AddButton = styled.button`  padding: 6px 12px;
  margin-top: 6px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  &:hover { background: #0069d9; }`;

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
				{tempTags.map(tag => ( <TagBubble key={tag}>
						{tag}
						<DeleteButton onClick={() => onRemoveTag(tag, true)}>×</DeleteButton> </TagBubble>
				))}
				<Input
					id={`input-${lang}`}
					value={inputValue}
					onChange={e => onInputChange(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder="Type and press Enter or comma"
				/> </TagInputContainer> <AddButton onClick={onAddTags}>Add Tags</AddButton>
			<TagInputContainer style={{ marginTop: "8px" }}>
				{tags.map(tag => ( <TagBubble key={tag}>
						{tag}
						<DeleteButton onClick={() => onRemoveTag(tag)}>×</DeleteButton> </TagBubble>
				))} </TagInputContainer>
		</>
	);
};

export default TagInput;
