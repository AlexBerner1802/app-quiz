import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import TagInput from "../components/ui/TagInput";
import i18n from "i18next";
import { updateTags } from "../services/api";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Button from "./ui/Button";
import {useTranslation} from "react-i18next";


const TagsManager = ({ tags: initialTags, loading }) => {

	const { t } = useTranslation();

	const langs = useMemo(
		() => Object.keys(i18n.options.resources).map(c => c.toLowerCase()),
		[]
	);

	const [tags, setTags] = useState({});
	const [inputs, setInputs] = useState({});
	const [tempTags, setTempTags] = useState({});
	const [removedTags, setRemovedTags] = useState({});

	// Initialize states once initialTags is loaded
	useEffect(() => {
		if (!loading && initialTags) {
			const tagsState = {};
			const inputsState = {};
			const tempState = {};
			const removedState = {};
			langs.forEach(lang => {
				const items = initialTags[lang] || [];
				tagsState[lang] = items.map(t => ({ id: t.id, name: t.name }));
				inputsState[lang] = "";
				tempState[lang] = [];
				removedState[lang] = [];
			});
			setTags(tagsState);
			setInputs(inputsState);
			setTempTags(tempState);
			setRemovedTags(removedState);
		}
	}, [initialTags, loading, langs]);

	const handleInputChange = (lang, value) => {
		if (value.includes(",")) {
			const parts = value.split(",").map(t => t.trim()).filter(Boolean);
			setTempTags(prev => ({
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

	const handleAddTags = lang => {
		const newTagNames = [
			...(tempTags[lang] || []),
			...inputs[lang].split(",").map(t => t.trim()).filter(Boolean),
		];

		const newTagsObjects = newTagNames
			.filter(name => !tags[lang].some(t => t.name === name))
			.map(name => ({ id: null, name }));

		setTags(prev => ({
			...prev,
			[lang]: [...(prev[lang] || []), ...newTagsObjects],
		}));

		setTempTags(prev => ({ ...prev, [lang]: [] }));
		setInputs(prev => ({ ...prev, [lang]: "" }));
	};

	const removeTag = (lang, tag, fromTemp = false) => {
		if (fromTemp) {
			setTempTags(prev => ({
				...prev,
				[lang]: (prev[lang] || []).filter(t => t !== tag),
			}));
		} else {
			setTags(prev => ({
				...prev,
				[lang]: (prev[lang] || []).filter(t => t.name !== tag.name),
			}));
			setRemovedTags(prev => ({
				...prev,
				[lang]: [...(prev[lang] || []), { id: tag.id || null, name: tag.name }],
			}));
		}
	};

	const handleSaveAll = async () => {
		const removedAny = Object.values(removedTags).some(arr => arr.length > 0);
		if (removedAny) {
			/* THIS IS IMPORTANT BECAUSE IT ERASE IN QUIZ TAGS , better to keep something Historique */
			const confirmDelete = window.confirm(
				"At least one tag was removed. Do you want to save the changes?"
			);
			if (!confirmDelete) return;
		}

		try {
			const payload = { tags: {}, removedTags: {} };
			langs.forEach(lang => {
				payload.tags[lang] = tags[lang].map(t => ({ id: t.id, name: t.name }));
				payload.removedTags[lang] = (removedTags[lang] || []).map(t => ({ id: t.id, name: t.name }));
			});

			// send payload directly
			await updateTags(payload);

			// clear temp state
			const emptyState = langs.reduce((acc, lang) => ({ ...acc, [lang]: [] }), {});
			const emptyInputs = langs.reduce((acc, lang) => ({ ...acc, [lang]: "" }), {});
			setTempTags(emptyState);
			setInputs(emptyInputs);
			setRemovedTags(emptyState);

			alert("Tags updated successfully!");
		} catch (err) {
			console.error("Failed to save tags:", err);
			alert(err.message);
		}
	};

	if (loading) {
		return <p>Loading tags...</p>;
	}

	return (
		<Container>
			<Content>
				<ResponsiveMasonry
					columnsCountBreakPoints={{ 600: 1, 1000: 2, 1800: 3 }}
				>
					<Masonry gutter="16px">
						{langs.map(lang => (
							<LanguageBlock key={lang}>
								<Label>
									{t("pages.content.tag_lang", { lang: lang.toUpperCase() })}
								</Label>
								<TagInput
									lang={lang}
									tempTags={tempTags[lang] || []}
									tags={tags[lang] || []}
									inputValue={inputs[lang] || ""}
									onInputChange={value => handleInputChange(lang, value)}
									onKeyDown={e => handleKeyDown(e, lang)}
									onAddTags={() => handleAddTags(lang)}
									onRemoveTag={(tag, fromTemp) => removeTag(lang, tag, fromTemp)}
								/>
							</LanguageBlock>
						))}
					</Masonry>
				</ResponsiveMasonry>
			</Content>

			<SaveButton variant={"success"} onClick={handleSaveAll}>{t("common.save")}</SaveButton>
		</Container>
	);
};

export default TagsManager;

const Container = styled.div`
	display: flex;
	flex-direction: column;
`;

const Content = styled.div`
	margin-bottom: var(--spacing);
`;

const LanguageBlock = styled.div`
	width: 100%;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-xs);
	background-color: var(--color-background-surface-1);
    padding: var(--spacing);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
`;

const Label = styled.label`
    font-weight: 500;
    font-size: var(--font-size);
    color: var(--color-text);
`;

const SaveButton = styled(Button)`
	margin-left: auto;
	width: fit-content;
`;
