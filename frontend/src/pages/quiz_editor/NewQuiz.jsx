import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FilePenLine, Save, Plus, Undo2, PenLine } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import UnsavedChangesGuard from "../../components/UnsavedChangesGuard";
import ToggleSwitch from "../../components/buttons/ToggleSwitchButton";
import LanguageSelector from "../../components/ui/LanguageSelector";
import Button from "../../components/ui/Button";
import Header from "../../components/layout/Header";
import { createQuiz, getQuiz, updateQuiz, getModules, getTags } from "../../services/api";
import TagInput from "../../components/ui/TagInput";
import CheckboxGroup from "../../components/ui/CheckboxGroup";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import ImageUploader from "../../components/ui/ImageUploader";
import Sidebar, { AddQuestionButton as SidebarAddQuestionButton } from "./Sidebar";
import Content from "./Content";

export default function NewQuiz() {
	const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

	const { t } = useTranslation();
	const navigate = useNavigate();

	// Routing
	const { id: quizId } = useParams();
	const isEdit = !!quizId;

	// Main states
	const [isDirty, setIsDirty] = useState(false);
	const [active, setActive] = useState(true);
	const [title, setTitle] = useState("");
	const [quiz_description, setQuizDescription] = useState("");
	const [questions, setQuestions] = useState([]);
	const questionRefs = useRef({});

	// Data
	const [coverImageFile, setCoverImageFile] = useState(null);
	const [coverImageUrl, setCoverImageUrl]   = useState("");

	const [modules, setModules] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);
	const [selectedModuleIds, setSelectedModuleIds] = useState([]);
	const [selectedTagIds, setSelectedTagIds] = useState([]);

	useEffect(() => {
		document.body.classList.add('page-newquiz');
		return () => document.body.classList.remove('page-newquiz');
	}, []);

	useEffect(() => {
		let alive = true;
		(async () => {
		try {
			const [mods, tgs] = await Promise.all([getModules(), getTags()]);
			if (!alive) return;
			setModules(mods || []);

			if (isEdit) {
			const q = await getQuiz(quizId);
			if (!alive) return;

			setTitle(q.title || "");
			setQuizDescription(q.quiz_description || "");
			setActive(!!q.is_active);
			setCoverImageUrl(q.cover_image_url || "");
			setSelectedModuleIds(Array.isArray(q.modules) ? q.modules.map(m => m.id) : []);
			setSelectedTagIds(Array.isArray(q.tags) ? q.tags.map(t => t.id) : []);
			setSelectedTags(Array.isArray(q.tags) ? q.tags : []);

			const mappedQs = Array.isArray(q.questions) ? q.questions.map(qq => {
				const answers = Array.isArray(qq.answers) ? qq.answers : [];
				const options = answers.map(a => a?.answer_text ?? "");
				const correctIndices = answers
				.map((a, i) => (a?.is_correct ? i : -1))
				.filter(i => i >= 0);
				return {
				id: `q_${qq.id ?? Math.random()}`,
				title: qq.question_titre || "",
				description: qq.question_description || "",
				options,
				correctIndices,
				};
			}) : [];
			setQuestions(mappedQs);
			setIsDirty(false);
			}
		} catch (e) {
			console.error(e);
			alert(e.message || "Erreur de chargement");
		}
		})();
		return () => { alive = false; };
	}, [isEdit, quizId]);

	const untitled = useMemo(
		() => t("quiz.placeholders.untitled") || t("common.untitled") || "Sans titre",
		[t]
	);

	const makeQuestion = () => {
		const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		const base = t("quiz.defaults.option") || "Option";
		return {
		id,
		title: "",
		description: "",
		options: [`${base} 1`, `${base} 2`, `${base} 3`],
		correctIndices: [],
		};
	};

	const addSingleQuestion = () => {
		const q = makeQuestion();
		setQuestions(prev => [...prev, q]);
		setIsDirty(true);
		setTimeout(() => {
		const el = questionRefs.current[q.id];
		el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
		}, 0);
	};

	const onSave = async () => {
		try {
		const preparedQuestions = (questions || []).map(q => ({
			title: q.title || "",
			description: q.description || "",
			options: q.options || [],
			correctIndices: q.correctIndices || [],
		}));

		const payload = {
			title,
			quiz_description,
			is_active: active,
			cover_image: coverImageFile ?? undefined,
			cover_image_url: coverImageUrl || undefined,
			module_ids: selectedModuleIds,
			tag_ids: selectedTagIds,
			questions: preparedQuestions,
		};

		if (isEdit) {
			await updateQuiz(quizId, payload);
		} else {
			await createQuiz(payload);
		}
		setIsDirty(false);
		navigate("/");
		} catch (e) {
		console.error(e);
		alert(e.message || "Error while saving");
		}
	};

	return (
		<>
		<FaviconTitle title={t("pages.createPage")} iconHref={faviconUrl} />

		<Main>
			<UnsavedChangesGuard when={isDirty} />

			<DesktopHeaderWrap>
			<Header
				title={
				<TitleInline>
					<BackIconButton onClick={() => navigate(-1)} aria-label={t("actions.back")}>
					<Undo2 size={24} />
					</BackIconButton>
					<FilePenLine size={20} />
					<span>{isEdit ? (t("quiz.editTitle") || "Éditer le quiz") : t("quiz.title")}</span>
				</TitleInline>
				}
				icon={null}
				actions={[
				<Controls key="controls">
					<ToggleSwitch
					checked={active}
					onChange={(v) => { setActive(v); setIsDirty(true); }}
					onLabel={t("common.active")}
					offLabel={t("common.inactive")}
					onColor="#22c55e"
					offColor="#e5e7eb"
					/>
					<LanguageSelector />
					<SaveButton onClick={onSave}>
					<Save size={16} />{t("actions.saveChanges")}
					</SaveButton>
				</Controls>
				]}
				showBurger
			/>
			</DesktopHeaderWrap>

			<Body>
			<Sidebar
				questions={questions}
				questionRefs={questionRefs}
				onAddQuestion={addSingleQuestion}
				setQuestions={setQuestions}
				setIsDirty={setIsDirty}
				untitled={untitled}
			/>

			<CenterPanel>
				<CenterInner>

				<QuizHeaderBlock>
					<InputShell data-variant="title">
						<PenLine aria-hidden="true" className="icon" />
						<TitleInput
							$withIcon
							value={title}
							onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
							placeholder={t("quiz.placeholders.untitled") || "Sans titre"}
						/>
					</InputShell>

					<InputShell data-variant="body" data-multiline="true">
						<PenLine aria-hidden="true" className="icon" />
						<DescTextarea
							$withIcon
							value={quiz_description}
							onChange={(e) => { setQuizDescription(e.target.value); setIsDirty(true); }}
							placeholder={t("quiz.sections.descriptionAdd") || t("common.placeholders.typeHere")}
							rows={2}
						/>
					</InputShell>
				</QuizHeaderBlock>

				{/* Image */}
				<ImageUploader
					style={{ marginBottom: "var(--spacing" }}
					value={coverImageFile || (coverImageUrl ? coverImageUrl : null)}
					onChange={(file) => {
					setCoverImageFile(file);
					setCoverImageUrl("");
					setIsDirty(true);
					}}
					onClear={() => {
					setCoverImageFile(null);
					setCoverImageUrl("");
					setIsDirty(true);
					}}
					placeholderText={t("quiz.fields.coverImage")}
					changeText={t("quiz.hints.changeImage")}
				/>

				{/* Modules */}
				<CheckboxGroup
					label={t("quiz.sections.module")}
					options={modules.map((m) => ({ id: m.id, label: m.module_name }))}
					value={selectedModuleIds}
					onChange={(ids) => {
					setSelectedModuleIds(ids);
					setIsDirty(true);
					}}
					direction="row"
				/>

				{/* Tags */}
				<TagInput
					label={t("quiz.sections.existingTag")}
					placeholder={t("quiz.sections.tagAdd")}
					prefixAdd="Ajouter"
					allowNew
					value={selectedTags}
					onChange={(arr) => {
					setSelectedTags(arr);
					setSelectedTagIds(arr.map(t => t.id));
					setIsDirty(true);
					}}
					width={"100%"}
					apiUrl={API_URL}
					fetchFromApi
				/>

				<Divider />

				{questions.length === 0 ? (
					<DropPlaceholder>
					{t("quiz.hints.emptyDrop")}
					<SidebarAddQuestionButton type="button" onClick={addSingleQuestion}>
						<Plus size={16} /> {t("actions.addQuestion")}
					</SidebarAddQuestionButton>
					</DropPlaceholder>
				) : (
					<Content
					questions={questions}
					setQuestions={setQuestions}
					setIsDirty={setIsDirty}
					questionRefs={questionRefs}
					/>
				)}
				</CenterInner>
			</CenterPanel>
			</Body>
		</Main>
		</>
	);
	}

const Main = styled.main`
	flex:1;
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
	background-color: var(--color-background);
	overflow: hidden;
`;

const Controls = styled.div`
	display:inline-flex;
	align-items:center;
	gap:12px;
	flex-wrap:wrap;
`;

const SaveButton = styled(Button)`
	background-color:var(--color-success-bg);
	&:hover{
		background-color: #134e4a;
	}
`;

const Body = styled.div`
	display: flex;
	flex: 1;
	min-height: 0;
	height: 100%;
	background-color: var(--color-background-surface);
`;

const CenterPanel = styled.section`
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: var(--spacing-l);
	overflow-y: auto;
	overflow-x: hidden;
`;

const CenterInner = styled.div `
	width:100%;
	max-width:var(--spacing-12xl);
	margin: 0 auto var(--spacing) auto;
	gap: var(--spacing);
	display: flex;
	flex-direction: column;
`;

const QuizHeaderBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
`;

const TitleInput = styled.input`
	width: 100%;
	border: none;
	font-size: var(--font-size-3xl);
	line-height: var(--line-height-xl);
	font-weight: 500;
	color: var(--color-text);
	padding-left: ${({ $withIcon }) => ($withIcon ? "var(--icon-inset)" : "0")};
	background: transparent!important;
	outline: none;
`;

const DescTextarea = styled.textarea`
	width: 100%;
	border: none;
	font-size: var(--font-size);
	line-height: var(--line-height-2xl);
	background: transparent!important;
	font-weight: 500;
	padding-left: ${({ $withIcon }) => ($withIcon ? "var(--icon-inset)" : "0")};
	color: var(--color-placeholder);
	resize: none;
	outline: none!important;
`;

const DropPlaceholder = styled.div`
	height:160px;
	border:2px dashed var(--color-border);
	border-radius: var(--border-radius);
	display:flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-s);
	color: var(--quiz-placeholder);
	background-color:var(--quiz-surface-muted);
	width:100%;

	@media (max-width: 768px){
		height:140px;
	}
`;

const Divider = styled.hr`
	margin: var(--spacing) 0;
	border-color: var(--color-separator);
`;

const DesktopHeaderWrap = styled.div`
	@media (max-width: 768px){
		display:none;
  }
`;

const TitleInline = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`;

const BackIconButton = styled(Button)`
	--size: 24px;
	width: var(--size);
	height: var(--size);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	color: var(--color-text);
	border-radius: 8px;
	cursor: pointer;
	line-height: 0;
	vertical-align: middle;

	svg { display: block; }

	&:hover {
		background: transparent!important;
		color: var(--color-primary-bg);
	}
`;

const InputShell = styled.div`
	--icon-inset: 28px;
	--icon-size: 18px;
	--baseline-tweak: 8px;

	position: relative;

	&[data-variant="title"] {
		--icon-inset: 30px;

		--icon-size: 28px;
		--baseline-tweak: 2px;
	}

	.icon {
		position: absolute;
		left: 0;
		width: var(--icon-size);
		height: var(--icon-size);
		pointer-events: none;
		color: var(--color-placeholder);

		top: calc(50% + var(--baseline-tweak));
		transform: translateY(-50%);
	}

	&[data-multiline="true"] .icon {

		top: calc(0.2em + var(--baseline-tweak));
		transform: none;
	}
`;