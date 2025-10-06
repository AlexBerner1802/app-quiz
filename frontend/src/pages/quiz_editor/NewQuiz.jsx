import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { FilePenLine, Save, Plus, Trash2, GripVertical, Edit3, Undo2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import UnsavedChangesGuard from "../../components/UnsavedChangesGuard";
import ToggleSwitch from "../../components/buttons/ToggleSwitchButton";
import LanguageSelector from "../../components/ui/LanguageSelector";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Header from "../../components/layout/Header";
import TextArea from "../../components/ui/TextArea";
import { createQuiz, getQuiz, updateQuiz, getModules, getTags } from "../../services/api";
import TagInput from "../../components/ui/TagInput";
import CheckboxGroup from "../../components/ui/CheckboxGroup";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";

/*
const suggestions = [
	{ id: 1, tag_name: "React" },
	{ id: 2, tag_name: "Vue" },
	{ id: 3, tag_name: "Angular" },
	{ id: 4, tag_name: "Svelte" },
];
*/

export default function NewQuiz() {
	const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

	const { t } = useTranslation();
	const navigate = useNavigate();

	// routing
	const { id: quizId } = useParams();
	const isEdit = !!quizId;

	// Main states
	const [isDirty, setIsDirty] = useState(false);
	const [active, setActive] = useState(true);
	const [title, setTitle] = useState("");
	const [quiz_description, setQuizDescription] = useState("");
	const [questions, setQuestions] = useState([]);

	// Drag and Drop for questions
	const [draggingId, setDraggingId] = useState(null);
	const [dragOverIndex, setDragOverIndex] = useState(null);
	const [dragOverPosition, setDragOverPosition] = useState(null);
	const questionRefs = useRef({});

	// Title + Icon
	const titleRef = useRef(null);
	const measureRef = useRef(null);
	const [iconLeft, setIconLeft] = useState(0);

	// Data
	const [coverImageFile, setCoverImageFile] = useState(null);
	const [coverImageUrl, setCoverImageUrl]   = useState("");
	const [coverPreview, setCoverPreview] = useState("");

	const [modules, setModules] = useState([]);
	const [tags, setTags] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);
	const [selectedModuleIds, setSelectedModuleIds] = useState([]);
	const [selectedTagIds, setSelectedTagIds] = useState([]);
	const [newTagInput, setNewTagInput] = useState("");
	const [newTags, setNewTags] = useState([]);

	const [selected, setSelected] = useState([]);

	useEffect(() => {
		document.body.classList.add('page-newquiz');
		return () => document.body.classList.remove('page-newquiz');
	}, []);

	useEffect(() => {
		if (coverImageFile) {
			const url = URL.createObjectURL(coverImageFile);
			setCoverPreview(url);
			return () => URL.revokeObjectURL(url);
		} else {
			setCoverPreview("");
		}
	}, [coverImageFile]);

	useEffect(() => {
		let alive = true;
		(async () => {
		try {
			const [mods, tgs] = await Promise.all([getModules(), getTags()]);
			if (!alive) return;
			setModules(mods || []);
			setTags(tgs || []);

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
		questionRefs.current[q.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 0);
	};

	const toggleCorrect = (id, idx) => {
		setQuestions(prev => prev.map(q => {
		if (q.id !== id) return q;
		const s = new Set(q.correctIndices || []);
		s.has(idx) ? s.delete(idx) : s.add(idx);
		return { ...q, correctIndices: Array.from(s).sort((a,b)=>a-b) };
		}));
		setIsDirty(true);
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
			// new_tags: newTags,
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

	const updateQuestion = (id, patch) => {
		setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
		setIsDirty(true);
	};

	const addOption = (id) => {
		setQuestions(prev => prev.map(q => {
		if (q.id !== id) return q;
		const base = t("quiz.defaults.option") || "Option";
		const nextLen = (q.options?.length ?? 0) + 1;
		return { ...q, options: [...(q.options ?? []), `${base} ${nextLen}`] };
		}));
		setIsDirty(true);
	};

	const updateOption = (id, idx, value) => {
		setQuestions(prev => prev.map(q => {
		if (q.id !== id) return q;
		const next = [...(q.options ?? [])];
		next[idx] = value;
		return { ...q, options: next };
		}));
		setIsDirty(true);
	};

	const removeOption = (id, idx) => {
		setQuestions(prev => prev.map(q => {
		if (q.id !== id) return q;
		const newOptions = (q.options ?? []).filter((_, i) => i !== idx);
		const nextCorrect = (q.correctIndices ?? [])
			.filter(i => i !== idx)
			.map(i => (i > idx ? i - 1 : i));
		return { ...q, options: newOptions, correctIndices: nextCorrect };
		}));
		setIsDirty(true);
	};

	const removeQuestion = (id) => {
		setQuestions(prev => prev.filter(q => q.id !== id));
		setIsDirty(true);
	};

	const scrollToQuestion = (id) => {
		questionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const move = (arr, from, to) => {
		const copy = arr.slice();
		const [item] = copy.splice(from, 1);
		copy.splice(to, 0, item);
		return copy;
	};
	const handleDragStart = (id) => (e) => {
		setDraggingId(id);
		e.stopPropagation();
		try { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; } catch {}
	};
	const handleDragOver = (index) => (e) => {
		e.preventDefault();
		const rect = e.currentTarget.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const pos = y < rect.height / 2 ? "before" : "after";
		if (dragOverIndex !== index || dragOverPosition !== pos) {
		setDragOverIndex(index); setDragOverPosition(pos);
		}
	};
	const handleDrop = (index) => (e) => {
		e.preventDefault();
		const from = questions.findIndex(q => q.id === draggingId);
		if (from < 0) return handleDragEnd();
		let to = dragOverPosition === "before" ? index : index + 1;
		if (from < to) to -= 1;
		if (from !== to) {
		setQuestions(prev => move(prev, from, to));
		setIsDirty(true);
		}
		handleDragEnd();
	};
	const handleDragEnd = () => {
		setDraggingId(null); setDragOverIndex(null); setDragOverPosition(null);
	};

	useLayoutEffect(() => {
		const el = titleRef.current;
		const meas = measureRef.current;
		if (!el || !meas) return;

		const recompute = () => {
		const text = el.value?.trim() ? el.value : (el.getAttribute("placeholder") || "");
		meas.textContent = text;
		const cs = getComputedStyle(el);
		const paddingLeft = parseFloat(cs.paddingLeft) || 0;
		const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
		const x = paddingLeft + borderLeft + meas.offsetWidth;
		setIconLeft(x + 6);
		};

		recompute();
		const ro = new ResizeObserver(recompute);
		ro.observe(el);
		window.addEventListener("resize", recompute);
		return () => { ro.disconnect(); window.removeEventListener("resize", recompute); };
	}, [title, t]);

	const toggleId = (id, list, setter) => {
		setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
		setIsDirty(true);
	};

	const toggleTagChip = (tg) => {
	const isSelected = selectedTagIds.includes(tg.id);

	setSelectedTagIds(prev =>
		isSelected ? prev.filter(id => id !== tg.id) : [...prev, tg.id]
	);

	setSelectedTags(prev => {
		if (isSelected) {
			return prev.filter(x => x.id !== tg.id);
		}
		return prev.find(x => x.id === tg.id)
			? prev
			: [...prev, { id: tg.id, tag_name: tg.tag_name }];
	});

	setIsDirty(true);
	};
		
	const addNewTag = () => {
		const name = newTagInput.trim();
		if (!name) return;
		const exists = tags.find(t => t.tag_name.toLowerCase() === name.toLowerCase());
		if (exists) {
		if (!selectedTagIds.includes(exists.id)) {
			setSelectedTagIds(prev => [...prev, exists.id]); setIsDirty(true);
		}
		} else if (!newTags.some(n => n.toLowerCase() === name.toLowerCase())) {
		setNewTags(prev => [...prev, name]); setIsDirty(true);
		}
		setNewTagInput("");
	};

	const createModuleInline = async () => {
		const name = newModuleInput.trim();
		if (!name) return;
		const exists = modules.find(m => m.module_name.toLowerCase() === name.toLowerCase());
		if (exists) {
		if (!selectedModuleIds.includes(exists.id)) {
			setSelectedModuleIds(prev => [...prev, exists.id]); setIsDirty(true);
		}
		setNewModuleInput(""); return;
		}
		try {
		setCreatingModule(true);
		const res = await fetch(`${API_URL}/api/modules`, {
			method: "POST",
			credentials: "omit",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({ module_name: name }),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
		setModules(prev => [...prev, data].sort((a,b)=>a.module_name.localeCompare(b.module_name)));
		setSelectedModuleIds(prev => (prev.includes(data.id) ? prev : [...prev, data.id]));
		setNewModuleInput(""); setIsDirty(true);
		} catch (e) {
		console.error(e); alert(e.message || "Erreur lors de la création du module");
		} finally {
		setCreatingModule(false);
		}
	};

	const moduleOptions = useMemo(
		() => (modules || [])
			.slice(0, 3)
			.map(m => ({ id: String(m.id), label: m.module_name })),
		[modules]
	);

  return (
    <>
		<FaviconTitle 
			title={t("pages.createPage")} iconHref={faviconUrl} 
		/>
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
				<LeftPanel>
					<LeftTitle>{t("quiz.sections.questions")}</LeftTitle>

					<AddQuestionButton type="button" onClick={addSingleQuestion}>
					<Plus size={16} /> {t("actions.addQuestion") || "Ajouter une question"}
					</AddQuestionButton>

					<LeftList>
					{questions.map((q, idx) => (
						<LeftRow
						key={q.id}
						onDragOver={handleDragOver(idx)}
						onDrop={handleDrop(idx)}
						data-drop-pos={dragOverIndex === idx ? dragOverPosition : undefined}
						>
						<DragDock
							draggable
							onDragStart={handleDragStart(q.id)}
							onDragEnd={handleDragEnd}
							onClick={(e) => e.stopPropagation()}
							aria-label={t("actions.reorder")}
							title={t("actions.reorder")}
							data-dragging={draggingId === q.id ? "true" : undefined}
						>
							<GripVertical size={16} />
						</DragDock>

						<LeftCard onClick={() => scrollToQuestion(q.id)} title={t("quiz.hints.goToQuestion") || "Aller à la question"}>
							<LeftCardIndex>{idx + 1}</LeftCardIndex>
							<LeftCardMain>
								<LeftCardTitle>{q.title?.trim() ? q.title : untitled}</LeftCardTitle>
								<TypePill>{(q.correctIndices?.length ?? 0) > 1 ? t("quiz.types.multi") : t("quiz.types.single")}</TypePill>
							</LeftCardMain>
						</LeftCard>
						</LeftRow>
					))}
					</LeftList>
				</LeftPanel>

					<CenterPanel>
						<CenterInner>
								<TitleLine>
									<TitleField onClick={() => titleRef.current?.focus()}>
									<TitleInput
										ref={titleRef}
										value={title}
										onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
										placeholder={t("quiz.placeholders.title")}
										aria-label={t("quiz.placeholders.title")}
									/>
									<MeasureSpan ref={measureRef} aria-hidden="true" />
									<EditIcon style={{ left: iconLeft }} aria-hidden="true" />
									</TitleField>
									<EditHint aria-hidden="true"><FilePenLine size={16} /></EditHint>
								</TitleLine>

							<DescBlock>
								<DescTextarea
									value={quiz_description}
									onChange={(e) => { setQuizDescription(e.target.value); setIsDirty(true); }}
									placeholder={t("quiz.sections.descriptionAdd") || t("common.placeholders.typeHere")}
									rows={2}
								/>
							</DescBlock>

							<Field>
								<CheckboxGroup
									label={t("quiz.sections.module")}
									options={moduleOptions}
									value={selectedModuleIds.map(String)}
									onChange={(ids) => {
									setSelectedModuleIds(ids.map(Number));
									setIsDirty(true);
									}}
									direction="row"
								/>

								{moduleOptions.length === 0 && (
									<Hint>{t("quiz.sections.noModule")}</Hint>
								)}
							</Field>

							<TagInput
									label={t("quiz.sections.existingTag")}
									placeholder ="Ajouter un tag..."
									prefixAdd ="Ajouter"
									allowNew
									// suggestions={suggestions}
									value={selectedTags}
									onChange={(arr) => {
										setSelectedTags(arr);
										setSelectedTagIds(arr.map(t => t.id));
										setIsDirty(true);
									}}
									width={"100%"}
									apiUrl={import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}
									fetchFromApi
							/>

							<Field>
								<FieldLabel>{t("quiz.fields.coverImage") || "Image de couverture"}</FieldLabel>

								<CoverDropzone
									previewUrl={coverPreview}
									existingUrl={coverImageFile ? "" : (coverImageUrl || "")}
									onPickFile={(file) => {
										setCoverImageFile(file);
										setCoverImageUrl("");
										setIsDirty(true);
									}}
									onClear={() => {
										setCoverImageFile(null);
										setCoverImageUrl("");
										setIsDirty(true);
									}}
									t={t}
								/>
							</Field>
						</CenterInner>

					{questions.length === 0 ? (
					<DropPlaceholder>
						{t("quiz.hints.emptyDrop") || "Ajoutez votre première question avec le bouton à gauche."}
					</DropPlaceholder>
					) : (
					<QuestionList>
						{questions.map((q) => (
						<QuestionCard key={q.id} ref={(el) => (questionRefs.current[q.id] = el)}>
							<QuestionHeader>
							<Badge>{(q.correctIndices?.length ?? 0) > 1 ? t("quiz.types.multi") : t("quiz.types.single")}</Badge>
							<DeleteBtn onClick={() => removeQuestion(q.id)} title={t("actions.delete")} aria-label={t("actions.delete")}>
								<Trash2 size={16} />
							</DeleteBtn>
							</QuestionHeader>

						<Field>
							<FieldLabel>{t("quiz.fields.title")}</FieldLabel>
							<MyInput
								value={q.title}
								onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
								placeholder={t("common.placeholders.typeHere")}
							/>
						</Field>

						<Field>
							<FieldLabel>{t("quiz.fields.description")}</FieldLabel>
							<MyTextArea
								value={q.description}
								onChange={(e) => updateQuestion(q.id, { description: e.target.value })}
								placeholder={t("common.placeholders.typeHere")}
								rows={3}
							/>
							</Field>

							<Divider />
							<OptionsHeader>{t("quiz.sections.options")}</OptionsHeader>

							{(q.options || []).map((opt, idx) => (
							<OptionRow key={idx}>
								<FakeCheck
									type="checkbox"
									checked={(q.correctIndices ?? []).includes(idx)}
									onChange={() => toggleCorrect(q.id, idx)}
									aria-label={`${t("quiz.sections.options")} #${idx + 1}`}
								/>
								<OptionInput value={opt} onChange={(e) => updateOption(q.id, idx, e.target.value)} />
								<RemoveOpt onClick={() => removeOption(q.id, idx)} title={t("actions.delete")} aria-label={t("actions.delete")}>
								<Trash2 size={16} />
								</RemoveOpt>
							</OptionRow>
							))}

							<AddOption type="button" onClick={() => addOption(q.id)}>
							<Plus size={16} /> {t("quiz.options.new")}
							</AddOption>
						</QuestionCard>
						))}
					</QuestionList>
					)}
				</CenterPanel>
			</Body>
		</Main>
    </>
  );
}

	function CoverDropzone({
	previewUrl,
	existingUrl,
	onPickFile,
	onClear,
	t,
	}) {
	const inputRef = useRef(null);
	const [isOver, setIsOver] = useState(false);

	const openPicker = () => inputRef.current?.click();

	const handleFiles = (files) => {
		const file = files?.[0];
		if (!file) return;
		if (!file.type?.startsWith("image/")) {
		alert("Veuillez sélectionner une image.");
		return;
		}
		onPickFile(file);
	};

	const onDrop = (e) => {
		e.preventDefault();
		setIsOver(false);
		handleFiles(e.dataTransfer.files);
	};

	return (
		<DropZone
		role="button"
		tabIndex={0}
		onClick={openPicker}
		onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
		onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
		onDragLeave={() => setIsOver(false)}
		onDrop={onDrop}
		data-over={isOver ? "1" : undefined}
		title={t("quiz.fields.coverImage") || "Image de couverture"}
		>
		{(previewUrl || existingUrl) ? (
			<PreviewWrap>
			<PreviewImg src={previewUrl || existingUrl} alt="aperçu" />
			<PreviewActions>
				<SmallButton type="button" onClick={openPicker}>
				Remplacer
				</SmallButton>
				<SmallDanger type="button" onClick={onClear}>
				Supprimer
				</SmallDanger>
			</PreviewActions>
			</PreviewWrap>
		) : (
			<DropInner>
			<span style={{ fontWeight: 600 }}>
				Glissez-déposez une image ici
			</span>
			<span style={{ fontSize: 12, opacity: 0.9 }}>
				ou cliquez pour choisir un fichier
			</span>
			</DropInner>
		)}

		<input
			ref={inputRef}
			type="file"
			accept="image/*"
			style={{ display: "none" }}
			onChange={(e) => handleFiles(e.target.files)}
		/>
		</DropZone>
	);
}

const Main = styled.main`
	flex:1;
	display: flex;
	flex-direction: column;
	width: 100%;
	background-color: var(--color-background);
	min-height: 100vh;
	min-height: 100dvh;
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
	display:grid;
	grid-template-columns:280px 1fr;
	grid-template-areas:"sidebar main";
	gap:16px;
	height:calc(100vh - 64px);
	flex: 1;
	min-height: 0;
	padding:16px 16px 24px 16px;
	background-color:var(--color-background);
	overflow:hidden;

	@media (max-width: 1024px){
		grid-template-columns:240px 1fr;
		gap:12px;
	} 
	@media (max-width: 768px){
		grid-template-columns:1fr;
		grid-template-areas:
		"sidebar"
		"main";
		height:auto;
		min-height:calc(100vh - 64px);
		overflow:visible;
		gap:12px;
		padding:12px;
	}
`;

const LeftPanel = styled.aside`
	grid-area: sidebar;
	border-right:1px solid var(--quiz-border);
	padding-right:16px;
	display:flex;
	flex-direction:column;
	gap:12px;
	background-color:var(--color-background);
	color:var(--color-text);
	overflow:auto;
	min-height: 0;

	@media (max-width: 768px){
		border-right:none;
		border-bottom:1px solid var(--quiz-border);
		padding-right:0;
		padding-bottom:12px;
		max-height:40vh;   
		overflow:auto;
	}
`;

const LeftTitle = styled.h2`
	font-size:14px;
	font-weight:700;
	margin:0;
`;

const AddQuestionButton = styled(Button)`
	display:inline-flex;
	align-items:center;
	gap:8px;
	background-color: #2563eb;
	border:1px solid #e5e7eb;
	border-radius:10px;
	padding:10px 12px;
	cursor:pointer;
	color: #fff;
	font-weight:600;
	&:hover{
		background-color: #1e40af;
	}

	@media (max-width: 768px){
		width:100%;
		justify-content:center;
	}
`;

const LeftList = styled.div`
	display:flex;
	flex-direction:column;
	gap:8px;
	user-select:none;

	@media (max-width: 768px){
		gap:6px;
	}
`;

const LeftRow = styled.div`
	display:grid;
	grid-template-columns:24px 1fr; 
	align-items:center;
	gap:6px;
	position:relative; 
	&::before{
		content:"";
		position:absolute;
		left:0; right:0;
		height:2px;
		background:#3b82f6;
		border-radius:1px;
		opacity:0;
		transition:opacity .1s ease;
	}
	&[data-drop-pos="before"]::before{ top:-3px; opacity:1; }
	&[data-drop-pos="after"]::before{ bottom:-3px; opacity:1; }

	@media (max-width: 768px){
		grid-template-columns:28px 1fr;
	}
`;

const LeftCard = styled(Button)`
	display:grid;
	grid-template-columns:28px 1fr;
	align-items:center;
	gap:8px;
	border:1px solid var(--quiz-border);
	border-radius:10px;
	background-color:var(--quiz-surface-muted);
	color:var(--color-text);
	padding:8px 10px;
	cursor:pointer;
	text-align:left;
	position:relative;
	cursor:grab;
	&[data-dragging="true"] {
		opacity:0.6;
		cursor:grabbing;
	}
	&::before {
		content:"";
		position:absolute;
		left:8px; right:8px;
		height:2px;
		background:#3b82f6;
		border-radius:1px;
		opacity:0;
		transition:opacity .1s ease;
		top:auto; bottom:auto;
	}
	&[data-drop-pos="before"]::before {
		top:-1px; bottom:auto; opacity:1;
	}
	&[data-drop-pos="after"]::before {
		bottom:-1px; top:auto; opacity:1;
	}
	&:hover{
		filter:brightness(0.98);
	}

	@media (max-width: 768px){
		padding:10px;
	}
`;

const LeftCardMain = styled.div`
	display:flex;
	align-items:center;
	justify-content:space-between;
	gap:8px;
	min-width:0;
`;

const DragDock = styled.div`
	display:flex;
	align-items:center;
	justify-content:center;
	width:24px;
	height:32px;
	color: #94a3b8;
	cursor:grab;
	&:hover{ color: #64748b; }
	&[data-dragging="true"]{
		opacity:.7;
		cursor:grabbing;
	}

	@media (max-width: 768px){
		width:28px;
		height:36px;
	}
`;

const LeftCardIndex = styled.span`
	display:inline-grid;
	place-items:center;
	width:24px;
	height:24px;
	font-size:12px;
	border-radius:999px;
	border:1px solid #c7d2fe;
	background:var(--color-background);
`;

const LeftCardTitle = styled.span`
	flex:1;
	font-size:14px;
	overflow:hidden;
	white-space:nowrap;
	text-overflow:ellipsis;
`;

const TypePill = styled.span`
	font-size:11px;
	line-height:1;
	border:1px solid #c7d2fe;
	border-radius:999px;
	padding:3px 6px;
	font-weight:600;
	background-color:var(--color-background);
	color:var(--color-text);
	white-space:nowrap;
`;

const CenterPanel = styled.section`
	grid-area: main;
	padding-left:8px;
	display:flex;
	flex-direction:column;
	overflow:hidden;
	min-height:0;
	border-radius:12px;
	background-color:var(--color-background);
	--content-width: clamp(900px, 48vw, 560px);

	@media (max-width: 768px){
		padding-left:0;
	}
`;

const CenterInner = styled.div `
	width:100%;
	max-width:var(--content-width);
	margin:0 auto 12px auto;

	@media (max-width: 768px){
		margin:0 auto 10px auto;
	}
`;

const TitleLine = styled.div`
	display:flex;
	align-items:center;
	gap:8px;
	margin: 6px 0 2px 0;
	&:hover ${''} svg {
		opacity: 0.6;
	}
`;

const TitleInput = styled(Input)`
	border: none;
	background-color: var(--color-background);
	outline: none;
	padding: 0;
	margin: 0;
	width: 100%;
	font-weight: 700;
	line-height: 1.2;
	color: var(--color-text);
	font-size: clamp(18px, 2.8vw, 28px);

	&::placeholder { color: #64748b; }
`;

const EditIcon = styled(Edit3).attrs({ size: 18 })`
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	color: #64748b;
	pointer-events: none;
	line-height: 0;
	transition: opacity .12s ease, transform .12s ease;
	svg { display: block; }
`;

const TitleField = styled.div`
	position: relative;
	display: block;
	width: 100%;
	cursor: text;

	&:has(${TitleInput}:not(:placeholder-shown)) ${EditIcon} {
		opacity: 0;
		transform: translateY(-50%) scale(0.98);
		pointer-events: none;
	}
`;

const MeasureSpan = styled.span`
	position: absolute;
	left: 0;
	top: 0;
	visibility: hidden;
	white-space: pre;
	pointer-events: none;

	font-weight: 700;
	line-height: 1.2;
	font-size: clamp(18px, 2.8vw, 28px);
	font-family: inherit;

	color: #64748b;
`;

const EditHint = styled.span`
	display:inline-grid;
	place-items:center;
	width:20px;
	height:20px;
	color:#94a3b8;
	opacity:0;
	transition: opacity .12s ease;
`;

const DescBlock = styled.div`
  	margin-top: 2px;
`;

const DescTextarea = styled(TextArea)`
	width:100%;
	border:none;
	outline:none;
	resize:vertical;
	background:transparent;
	color:var(--color-text);
	line-height:1.4;
	font-size: 14px;
	padding: 2px 0;
	&::placeholder{
		color: #94a3b8;
	}
`;

const MyTextArea = styled(TextArea)`
  	background-color:var(--quiz-surface);
`;

const Field = styled.div`
	display:grid;
	gap:6px;
	margin-bottom:10px;
`;

const FieldLabel = styled.label`
	font-size:12px;
	color:var(--color-text);
`;

const MyInput = styled(Input)`
	height:38px;
	border:1px solid #fff;
	border-radius:8px;
	padding:0 10px;
	background-color:var(--quiz-surface);
	color:var(--color-text);
`;

const DropPlaceholder = styled.div`
	height:160px;
	border:2px dashed var(--quiz-border);
	border-radius:12px;
	display:grid;
	place-items:center;
	color: var(--quiz-placeholder);
	background-color:var(--quiz-surface-muted);
	width:100%;
	max-width:var(--content-width);
	margin:0 auto;

	@media (max-width: 768px){
		height:140px;
	}
`;

const QuestionList = styled.div`
	display:flex;
	flex-direction:column;
	gap:12px;
	flex:1;
	min-height:0;
	overflow-y:auto;
	padding:0 12px;
	align-items:center;

	@media (max-width: 768px){
		padding:0 8px;
	}
`;

const QuestionCard = styled.div`
	border:1px solid var(--quiz-border);
	border-radius:12px;
	background-color:var(--quiz-surface-muted);
	padding:12px;
	width:100%;
	max-width:var(--content-width);
	margin: 0 auto;

	@media (max-width: 768px){
		padding:10px;
	}
`;

const QuestionHeader = styled.div`
	display:flex;
	align-items:center;
	justify-content:space-between;
	margin-bottom:10px;
`;

const Badge = styled.span`
	font-size:12px;
	border:1px solid #c7d2fe;
	border-radius:999px;
	padding:3px 8px;
	font-weight:600;
	background-color:var(--color-background);
	color:var(--color-text);
`;

const DeleteBtn = styled.button`
	border: none;
	background:transparent;
	color: var(--color-text);
	cursor: pointer;
	transition: background-color .15s ease;

	&:hover {
		background-color: var(--brand-error-600);
		color: #000;
	}
`;

const OptionsHeader = styled.div`
	font-size:14px;
	font-weight:600;
	margin-bottom:8px;
	color:var(--color-text);
`;

const OptionRow = styled.div`
	display:grid;
	grid-template-columns:auto 1fr auto;
	align-items:center;
	gap:8px;
	padding:6px 8px;
	border:1px solid var(--quiz-border);
	border-radius:8px;
	background-color:var(--quiz-surface);
	margin-bottom:8px;
`;

const FakeCheck = styled(Input)``;

const OptionInput = styled(Input)`
	height:34px;
	border:none;
	background:transparent;
	outline:none;
	color:var(--color-text);
`;

const RemoveOpt = styled.button`
	border: none;
	background:transparent;
	color: var(--color-text);
	cursor: pointer;
	transition: background-color .15s ease;

	&:hover {
		background-color: var(--brand-error-600);
		color: #000;
	}
`;

const AddOption = styled(Button)`
	display:inline-flex;
	align-items:center;
	gap:6px;
	background-color: #2563eb;
	border:1px solid #e5e7eb;
	border-radius:8px;
	padding:8px 10px;
	cursor:pointer;
	font-weight:500;
	color:#fff;
	&:hover{
		background-color: #1e40af;
	}
`;

const Divider = styled.hr`
	margin:10px 0;
	border:none;
	border-top:1px solid var(--quiz-border);
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

	&:hover { background: var(--quiz-border)!important; }
`;

const Hint = styled.span`
	font-size: 12px;
	color: #94a3b8;
`;

const DropZone = styled.div`
	border: 2px dashed var(--quiz-border);
	background: var(--quiz-surface-muted);
	border-radius: 12px;
	padding: 14px;
	min-height: 140px;
	display: grid;
	place-items: center;
	cursor: pointer;
	outline: none;
	transition: border-color .15s ease, background-color .15s ease, transform .05s ease;

	&[data-over="1"]{
		border-color: #3b82f6;
		background: rgba(59,130,246,.08);
		transform: scale(0.999);
	}
`;

const DropInner = styled.div`
	display: grid;
	gap: 6px;
	text-align: center;
	color: var(--color-text);
`;

const PreviewWrap = styled.div`
	width: 100%;
	display: grid;
	gap: 10px;
`;

const PreviewImg = styled.img`
	width: 100%;
	max-height: 280px;
	object-fit: cover;
	border-radius: 10px;
	border: 1px solid var(--quiz-border);
	background: #000;
`;

const PreviewActions = styled.div`
  	display: flex;
  	gap: 8px;
  	justify-content: flex-end;
`;

const SmallButton = styled(Button)`
	padding: 6px 10px;
	border-radius: 8px;
	background: #2563eb;
	color: #fff;
	&:hover { background: #1e40af; }
`;

const SmallDanger = styled.button`
	padding: 6px 10px;
	border-radius: 8px;
	background: var(--brand-error-600);
	color: #ffffffff;
	&:hover { 
		filter: brightness(0.95); 
		background-color: #af1e1eff;
	}
`;
