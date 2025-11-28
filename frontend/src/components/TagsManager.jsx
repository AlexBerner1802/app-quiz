import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import TagInput from "../components/ui/TagInput";
import i18n from "i18next";
import { updateTags } from "../services/api";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Button from "./ui/Button";
import {useTranslation} from "react-i18next";
import {Loader2} from "lucide-react";


const TagsManager = ({ tags: initialTags, loading, showLoader }) => {

	const { t } = useTranslation();

	const langs = useMemo(
		() => Object.keys(i18n.options.resources).map(c => c.toLowerCase()),
		[]
	);

	const [inputs, setInputs] = useState({});
	const [tempTags, setTempTags] = useState({});
	const [isSaving, setIsSaving] = useState(false)
	const [removedTags, setRemovedTags] = useState({});

	useEffect(() => {
		if (!loading && initialTags) {
			const tempState = {};
			const inputsState = {};
			const removedState = {};

			langs.forEach(lang => {
				const existing = initialTags[lang] || [];
				tempState[lang] = existing.map(t => ({ id: t.id, name: t.name }));
				inputsState[lang] = "";
				removedState[lang] = [];
			});

			setTempTags(tempState);
			setInputs(inputsState);
			setRemovedTags(removedState);
		}
	}, [initialTags, loading, langs]);

	// Add tag on input change (Enter or comma)
	const handleInputChange = (lang, value) => {
		if (value.includes(",")) {
			const parts = value.split(",").map(t => t.trim()).filter(Boolean);
			setTempTags(prev => ({
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

	const removeTag = (lang, tag) => {
		setTempTags(prev => ({
			...prev,
			[lang]: (prev[lang] || []).filter(t => (t.name ?? t) !== (tag.name ?? tag)),
		}));

		if (tag.id) {
			setRemovedTags(prev => ({
				...prev,
				[lang]: [...(prev[lang] || []), tag]
			}));
		}
	};

	const handleSaveAll = async () => {
		if (isSaving) return;
		setIsSaving(true);

		try {
			const payload = { tags: {}, removedTags: {} };
			langs.forEach(lang => {
				payload.tags[lang] = tempTags[lang] || [];
				payload.removedTags[lang] = removedTags[lang] || [];
			});

			await updateTags(payload);
			alert("Tags updated successfully!");
		} catch (err) {
			console.error("Failed to save tags:", err);
			alert(err.message || "An error occurred while saving.");
		} finally {
			setIsSaving(false);
		}
	};


	return (
		<Container>
			{
				loading && (
					<LoadingWrapper $fadingOut={!showLoader}>
						<Loader2 className="spin" size={32} strokeWidth={2.5} color={"var(--color-primary-bg, #2684ff)"}/>
					</LoadingWrapper>
				)
			}

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
									tags={tempTags[lang] || []}
									inputValue={inputs[lang] || ""}
									onInputChange={value => handleInputChange(lang, value)}
									onKeyDown={e => handleKeyDown(e, lang)}
									onRemoveTag={(tag, fromTemp) => removeTag(lang, tag, fromTemp)}
									placeholder={t("common.type_and_press_enter_or_comma")}
								/>
							</LanguageBlock>
						))}
					</Masonry>
				</ResponsiveMasonry>
			</Content>

			<SaveButton variant={"success"} onClick={handleSaveAll} disabled={isSaving}>
				{t("common.save")}
			</SaveButton>
		</Container>
	);
};

export default TagsManager;


const LoadingWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    inset: 0; // top:0; left:0; right:0; bottom:0;
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

const Container = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
`;

const Content = styled.div`
	margin-bottom: var(--spacing);
`;

const LanguageBlock = styled.div`
	width: 100%;
    border: 1px solid var(--color-border);
	box-shadow: var(--box-shadow-s);
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
