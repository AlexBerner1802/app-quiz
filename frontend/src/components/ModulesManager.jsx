import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import TagInput from "../components/ui/TagInput";
import i18n from "i18next";
import { updateModules } from "../services/api";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Button from "./ui/Button";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

const ModulesManager = ({ modules: initialModules, loading, showLoader }) => {
	const { t } = useTranslation();


	const langs = useMemo(
		() => Object.keys(i18n.options.resources).map(c => c.toLowerCase()),
		[]
	);

	const [inputs, setInputs] = useState({});
	const [tempModules, setTempModules] = useState({});
	const [isSaving, setIsSaving] = useState(false);
	const [removedModules, setRemovedModules] = useState({});

	useEffect(() => {
		if (!loading && initialModules) {
			const tempState = {};
			const inputsState = {};
			const removedState = {};

			langs.forEach(lang => {
				const existing = initialModules[lang] || [];
				tempState[lang] = existing.map(m => ({ id: m.id, name: m.name }));
				inputsState[lang] = "";
				removedState[lang] = []; // initialize removed modules
			});

			setTempModules(tempState);
			setInputs(inputsState);
			setRemovedModules(removedState);
		}
	}, [initialModules, loading, langs]);

	const handleInputChange = (lang, value) => {
		if (value.includes(",")) {
			const parts = value.split(",").map(t => t.trim()).filter(Boolean);
			setTempModules(prev => ({
				...prev,
				[lang]: [...(prev[lang] || []), ...parts.map(name => ({ id: null, name }))]
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

	const removeModule = (lang, module) => {
		setTempModules(prev => ({
			...prev,
			[lang]: (prev[lang] || []).filter(m => (m.name ?? m) !== (module.name ?? module))
		}));

		// Only track removed modules if it has an ID (existing module)
		if (module.id) {
			setRemovedModules(prev => ({
				...prev,
				[lang]: [...(prev[lang] || []), module]
			}));
		}
	};

	const handleSaveAll = async () => {
		if (isSaving) return;
		setIsSaving(true);

		try {
			const payload = { modules: {}, removedModules: {} };
			langs.forEach(lang => {
				payload.modules[lang] = tempModules[lang] || [];
				payload.removedModules[lang] = removedModules[lang] || [];
			});

			await updateModules(payload);
			alert("Modules updated successfully!");
		} catch (err) {
			console.error("Failed to save modules:", err);
			alert(err.message || "An error occurred while saving.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Container>
			{loading && (
				<LoadingWrapper $fadingOut={!showLoader}>
					<Loader2 className="spin" size={32} strokeWidth={2.5} color={"var(--color-primary-bg, #2684ff)"} />
				</LoadingWrapper>
			)}

			<Content>
				<ResponsiveMasonry columnsCountBreakPoints={{ 600: 1, 1000: 2, 1800: 3 }}>
					<Masonry gutter="16px">
						{langs.map(lang => (
							<LanguageBlock key={lang}>
								<Label>
									{t("pages.content.module_lang", { lang: lang.toUpperCase() })}
								</Label>
								<TagInput
									lang={lang}
									tags={tempModules[lang] || []}
									inputValue={inputs[lang] || ""}
									onInputChange={value => handleInputChange(lang, value)}
									onKeyDown={e => handleKeyDown(e, lang)}
									onRemoveTag={tag => removeModule(lang, tag)}
									placeholder={t("common.type_and_press_enter_or_comma")}
								/>
							</LanguageBlock>
						))}
					</Masonry>
				</ResponsiveMasonry>
			</Content>

			<SaveButton variant="success" onClick={handleSaveAll} disabled={isSaving}>
				{t("common.save")}
			</SaveButton>
		</Container>
	);

};

export default ModulesManager;

const LoadingWrapper = styled.div`
display: flex;
justify-content: center;
align-items: center;
position: absolute;
inset: 0;
background-color: var(--color-background, #fff);
color: var(--color-primary-bg, #2684ff);
opacity: ${({ $fadingOut }) => ($fadingOut ? 0 : 1)};
transition: opacity 0.4s ease;
z-index: 100;

	.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	100% {
		transform: rotate(360deg);
}
}

`;

const Container = styled.div`    display: flex;
    flex-direction: column;
    position: relative;`;

const Content = styled.div`    margin-bottom: var(--spacing);`;

const LanguageBlock = styled.div`    width: 100%;
    border: 1px solid var(--color-border);
    box-shadow: var(--box-shadow-s);
    border-radius: var(--border-radius-xs);
    background-color: var(--color-background-surface-1);
    padding: var(--spacing);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);`;

const Label = styled.label`    font-weight: 500;
    font-size: var(--font-size);
    color: var(--color-text);`;

const SaveButton = styled(Button)`    margin-left: auto;
    width: fit-content;`;
