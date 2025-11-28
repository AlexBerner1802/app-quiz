import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import TagInput from "../components/ui/TagInput"; // same input can be reused
import i18n from "i18next";
import { updateModules } from "../services/api";

const ModulesManager = ({ modules: initialModules, loading }) => {
	const langs = useMemo(
		() => Object.keys(i18n.options.resources).map(c => c.toLowerCase()),
		[]
	);

	const [modules, setModules] = useState({});
	const [inputs, setInputs] = useState({});
	const [tempModules, setTempModules] = useState({});
	const [removedModules, setRemovedModules] = useState({});

	// Initialize state once initialModules is loaded
	useEffect(() => {
		if (!loading && initialModules) {
			const modulesState = {};
			const inputsState = {};
			const tempState = {};
			const removedState = {};
			langs.forEach(lang => {
				const items = initialModules[lang] || [];
				modulesState[lang] = items.map(m => ({ id: m.id, name: m.name }));
				inputsState[lang] = "";
				tempState[lang] = [];
				removedState[lang] = [];
			});
			setModules(modulesState);
			setInputs(inputsState);
			setTempModules(tempState);
			setRemovedModules(removedState);
		}
	}, [initialModules, loading, langs]);

	const handleInputChange = (lang, value) => {
		if (value.includes(",")) {
			const parts = value.split(",").map(t => t.trim()).filter(Boolean);
			setTempModules(prev => ({
				...prev,
				[lang]: [...(prev[lang] || []), ...parts.filter(t => !(prev[lang] || []).includes(t))],
			}));
			setInputs(prev => ({ ...prev, [lang]: "" }));
		} else {
			setInputs(prev => ({ ...prev, [lang]: value }));
		}
	};

	const handleKeyDown = (e, lang) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (inputs[lang]?.trim()) handleInputChange(lang, inputs[lang] + ",");
		}
	};

	const handleAddModules = lang => {
		const newModuleNames = [
			...(tempModules[lang] || []),
			...inputs[lang].split(",").map(t => t.trim()).filter(Boolean),
		];

		const newModulesObjects = newModuleNames
			.filter(name => !modules[lang].some(t => t.name === name))
			.map(name => ({ id: null, name }));

		setModules(prev => ({
			...prev,
			[lang]: [...(prev[lang] || []), ...newModulesObjects],
		}));

		setTempModules(prev => ({ ...prev, [lang]: [] }));
		setInputs(prev => ({ ...prev, [lang]: "" }));
	};

	const removeModule = (lang, module, fromTemp = false) => {
		if (fromTemp) {
			setTempModules(prev => ({
				...prev,
				[lang]: (prev[lang] || []).filter(t => t !== module),
			}));
		} else {
			setModules(prev => ({
				...prev,
				[lang]: (prev[lang] || []).filter(t => t.name !== module.name),
			}));
			setRemovedModules(prev => ({
				...prev,
				[lang]: [...(prev[lang] || []), { id: module.id || null, name: module.name }],
			}));
		}
	};

	const handleSaveAll = async () => {
		const removedAny = Object.values(removedModules).some(arr => arr.length > 0);
		if (removedAny) {
			/* THIS IS IMPORTANT BECAUSE IT ERASE IN QUIZ TAGS , better to keep something Historique */
			const confirmDelete = window.confirm(
				"At least one module was removed. Do you want to save the changes?"
			);
			if (!confirmDelete) return;
		}

		try {
			const payload = { modules: {}, removedModules: {} };
			langs.forEach(lang => {
				payload.modules[lang] = modules[lang].map(m => ({ id: m.id, name: m.name }));
				payload.removedModules[lang] = (removedModules[lang] || []).map(m => ({ id: m.id, name: m.name }));
			});

			await updateModules(payload);

			const emptyState = langs.reduce((acc, lang) => ({ ...acc, [lang]: [] }), {});
			const emptyInputs = langs.reduce((acc, lang) => ({ ...acc, [lang]: "" }), {});
			setTempModules(emptyState);
			setInputs(emptyInputs);
			setRemovedModules(emptyState);

			alert("Modules updated successfully!");
		} catch (err) {
			console.error("Failed to save modules:", err);
			alert(err.message);
		}
	};

	if (loading) return <p>Loading modules...</p>;

	return (
		<Container>
			{langs.map(lang => (
				<LanguageBlock key={lang}>
					<Label>{lang.toUpperCase()} Modules</Label>
					<TagInput
						lang={lang}
						tempTags={tempModules[lang] || []}
						tags={modules[lang] || []}
						inputValue={inputs[lang] || ""}
						onInputChange={value => handleInputChange(lang, value)}
						onKeyDown={e => handleKeyDown(e, lang)}
						onAddTags={() => handleAddModules(lang)}
						onRemoveTag={(tag, fromTemp) => removeModule(lang, tag, fromTemp)}
					/>
				</LanguageBlock>
			))}
			<SaveButton onClick={handleSaveAll}>Save All Modules</SaveButton>
		</Container>
	);
};

export default ModulesManager;

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

const SaveButton = styled.button`
  margin-top: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background-color: #4caf50;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;
