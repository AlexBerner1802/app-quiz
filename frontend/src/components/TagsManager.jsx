import React, { useState } from "react";
import styled from "styled-components";
import TagInput from "../components/ui/TagInput";

const Container = styled.div`  display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;`;

const LanguageBlock = styled.div`  border: 1px solid #ccc;
	border-radius: 8px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;`;

const Label = styled.label`  font-size: 14px;
	font-weight: 600;
	color: #333;`;

const TagsManager = ({ languages = ["en", "fr"] }) => {
	const [tags, setTags] = useState({ en: ["Finance", "Tax", "AI"], fr: ["Finance", "Impôt", "IA"] });
	const [inputs, setInputs] = useState(() => languages.reduce((acc, lang) => ({ ...acc, [lang]: "" }), {}));
	const [tempTags, setTempTags] = useState(() => languages.reduce((acc, lang) => ({ ...acc, [lang]: [] }), {}));

	const handleInputChange = (lang, value) => {
		if (value.includes(",")) {
			const parts = value.split(",").map(t => t.trim()).filter(Boolean);
			setTempTags(prev => ({
				...prev,
				[lang]: Array.isArray(prev[lang]) ? [...prev[lang], ...parts.filter(t => !prev[lang].includes(t))] : parts
			}));
			setInputs(prev => ({ ...prev, [lang]: "" }));
		} else {
			setInputs(prev => ({ ...prev, [lang]: value }));
		}
	};

	const handleKeyDown = (e, lang) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (inputs[lang].trim()) handleInputChange(lang, inputs[lang] + ",");
		}
	};

	const handleAddTags = (lang) => {
		setTags(prevTags => {
			const currentTags = Array.isArray(prevTags[lang]) ? prevTags[lang] : [];
			const newTemp = Array.isArray(tempTags[lang]) ? tempTags[lang] : [];
			const inputTags = inputs[lang].trim() ? inputs[lang].split(",").map(t => t.trim()).filter(Boolean) : [];
			const combined = [...currentTags, ...newTemp.filter(t => !currentTags.includes(t)), ...inputTags.filter(t => !currentTags.includes(t))];
			return { ...prevTags, [lang]: combined };
		});
		setTempTags(prev => ({ ...prev, [lang]: [] }));
		setInputs(prev => ({ ...prev, [lang]: "" }));
	};

	const removeTag = (lang, tag, fromTemp = false) => {
		if (fromTemp) {
			setTempTags(prev => ({ ...prev, [lang]: (Array.isArray(prev[lang]) ? prev[lang] : []).filter(t => t !== tag) }));
		} else {
			setTags(prev => ({ ...prev, [lang]: (Array.isArray(prev[lang]) ? prev[lang] : []).filter(t => t !== tag) }));
		}
	};

	return ( <Container>
			{languages.map(lang => ( <LanguageBlock key={lang}> <Label>{lang.toUpperCase()} Tags</Label>
					<TagInput
						lang={lang}
						tempTags={tempTags[lang]}
						tags={tags[lang]}
						inputValue={inputs[lang]}
						onInputChange={value => handleInputChange(lang, value)}
						onKeyDown={e => handleKeyDown(e, lang)}
						onAddTags={() => handleAddTags(lang)}
						onRemoveTag={(tag, fromTemp) => removeTag(lang, tag, fromTemp)}
					/> </LanguageBlock>
			))} </Container>
	);
};

export default TagsManager;
