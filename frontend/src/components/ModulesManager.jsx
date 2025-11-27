import React, { useState } from "react";
import styled from "styled-components";
import TagInput from "../components/ui/TagInput"; // reuse the same input component

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const LanguageBlock = styled.div`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const ModuleManager = ({ languages = ["en", "fr"] }) => {
	const [modules, setModules] = useState({
		en: ["User Management", "Billing", "Analytics"],
		fr: ["Gestion des utilisateurs", "Facturation", "Analytique"],
	});

	const [inputs, setInputs] = useState(
		() => languages.reduce((acc, lang) => ({ ...acc, [lang]: "" }), {})
	);

	const [tempModules, setTempModules] = useState(
		() => languages.reduce((acc, lang) => ({ ...acc, [lang]: [] }), {})
	);

	const handleInputChange = (lang, value) => {
		if (value.includes(",")) {
			const parts = value.split(",").map(t => t.trim()).filter(Boolean);
			setTempModules(prev => ({
				...prev,
				[lang]: [...(prev[lang] || []), ...parts.filter(t => !prev[lang].includes(t))],
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

	const handleAddModules = (lang) => {
		setModules(prev => {
			const current = prev[lang] || [];
			const newTemp = tempModules[lang] || [];
			const inputModules = inputs[lang].trim()
				? inputs[lang].split(",").map(t => t.trim()).filter(Boolean)
				: [];
			return { ...prev, [lang]: [...current, ...newTemp.filter(m => !current.includes(m)), ...inputModules.filter(m => !current.includes(m))] };
		});
		setTempModules(prev => ({ ...prev, [lang]: [] }));
		setInputs(prev => ({ ...prev, [lang]: "" }));
	};

	const removeModule = (lang, module, fromTemp = false) => {
		if (fromTemp) {
			setTempModules(prev => ({ ...prev, [lang]: (prev[lang] || []).filter(m => m !== module) }));
		} else {
			setModules(prev => ({ ...prev, [lang]: (prev[lang] || []).filter(m => m !== module) }));
		}
	};

	return (
		<Container>
			{languages.map(lang => (
				<LanguageBlock key={lang}>
					<Label>{lang.toUpperCase()} Modules</Label>
					<TagInput
						lang={lang}
						tempTags={tempModules[lang]}
						tags={modules[lang]}
						inputValue={inputs[lang]}
						onInputChange={value => handleInputChange(lang, value)}
						onKeyDown={e => handleKeyDown(e, lang)}
						onAddTags={() => handleAddModules(lang)}
						onRemoveTag={(tag, fromTemp) => removeModule(lang, tag, fromTemp)}
					/>
				</LanguageBlock>
			))}
		</Container>
	);
};

export default ModuleManager;
