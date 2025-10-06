import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FilePenLine, Save, Plus, Trash2, GripVertical, Undo2 } from "lucide-react";
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
import ImageUploader from "../../components/ui/ImageUploader";
import CheckBox from "../../components/ui/CheckBox";


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
	const inputRef = useRef(null);
	const descRef = useRef(null);

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


  return (
    <>
		<FaviconTitle title={t("pages.createPage")}
					  iconHref={faviconUrl} />

		<Main>
			<UnsavedChangesGuard when={isDirty} />

			<DesktopHeaderWrap>
				<Header title={
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
					showBurger />
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
									<LeftCardHeader>
										<LeftCardIndex>{idx + 1}</LeftCardIndex>
										<TypePill>{(q.correctIndices?.length ?? 0) > 1 ? t("quiz.types.multi") : t("quiz.types.single")}</TypePill>
									</LeftCardHeader>
									<LeftCardMain>
										<LeftCardTitle>{q.title?.trim() ? q.title : untitled}</LeftCardTitle>
									</LeftCardMain>
								</LeftCard>
							</LeftRow>
						))}
					</LeftList>
				</LeftPanel>

					<CenterPanel>
						<CenterInner>

							<div>
								<TitleInput
									ref={inputRef}
									value={title}
									width={"100%"}
									inputWrapperBg={"transparent"}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Enter quiz title..."
								/>

								<DescTextarea
									ref={descRef}
									value={quiz_description}
									width={"100%"}
									inputWrapperStyle={{ background: "transparent"}}
									onChange={(e) => { setQuizDescription(e.target.value); setIsDirty(true); }}
									placeholder={t("quiz.sections.descriptionAdd") || t("common.placeholders.typeHere")}
									rows={2}
								/>
							</div>

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
								placeholderText={t("quiz.fields.coverImage") || "Glissez-déposez une image ici ou cliquez"}
								changeText={t("quiz.hints.changeImage") || "Cliquez pour changer l'image"}
							/>

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

							<Divider />

							{questions.length === 0 ? (
								<DropPlaceholder>
									{t("quiz.hints.emptyDrop") || "Ajoutez votre première question avec le bouton à gauche."}
									<AddQuestionButton type="button" onClick={addSingleQuestion}>
										<Plus size={16} /> {t("actions.addQuestion") || "Ajouter une question"}
									</AddQuestionButton>
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

										<Input
											value={q.title}
											width={"100%"}
											label={t("quiz.fields.title")}
											onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
											placeholder={t("quiz.fields.title")}
										/>

										<TextArea
											value={q.description}
											width={"100%"}
											onChange={(e) => updateQuestion(q.id, { description: e.target.value })}
											placeholder={t("quiz.fields.description")}
											rows={3}
										/>


										<OptionsContainer>
											<OptionsHeader>{t("quiz.sections.options")}</OptionsHeader>

											<OptionsContent>
												{(q.options || []).map((opt, idx) => (
													<OptionRow key={idx}>
														<CheckBox
															checked={(q.correctIndices ?? []).includes(idx)}
															onChange={() => toggleCorrect(q.id, idx)}
															type="checkbox"
															aria-label={`${t("quiz.sections.options")} #${idx + 1}`}
														/>
														<OptionInput width={"100%"} value={opt} onChange={(e) => updateOption(q.id, idx, e.target.value)} />
														<RemoveOpt onClick={() => removeOption(q.id, idx)} title={t("actions.delete")} aria-label={t("actions.delete")}>
															<Trash2 size={16} />
														</RemoveOpt>
													</OptionRow>
												))}
											</OptionsContent>

											<Button type="button" onClick={() => addOption(q.id)}>
												<Plus size={16} /> {t("quiz.options.new")}
											</Button>
										</OptionsContainer>
									</QuestionCard>
									))}
								</QuestionList>
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
    background-color: var(--color-background);
`;

const LeftPanel = styled.aside`
    width: var(--spacing-8xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    padding: var(--spacing-l);
    border-right: 1px solid var(--color-border);
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;

    @media (max-width: 768px) {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--color-border);
        max-height: 40vh;
    }
`;


const LeftTitle = styled.h2`
	font-size: var(--font-size);
	font-weight: 600;
	margin: 0;
`;

const AddQuestionButton = styled(Button)`
	@media (max-width: 768px){
		width:100%;
		justify-content:center;
	}
`;

const LeftList = styled.div`
	display:flex;
	flex-direction:column;
    gap:var(--spacing);
	user-select:none;
	height: 30000px;
	flex: 1;
	min-height: 0;

	@media (max-width: 768px){
		gap:var(--spacing);
	}
`;

const LeftRow = styled.div`
	display: flex;
	width: 100%;
	align-items:center;
	gap: var(--spacing-xs);
`;

const TypePill = styled.span`
	font-size: var(--font-size-xs);
	line-height:1;
	border:1px solid var(--color-border);
	border-radius: 999px;
	padding: 4px 6px;
	font-weight:500;
	color:var(--color-text);
	white-space:nowrap;
    transition : all 0.2s ease;
`;

const LeftCard = styled(Button)`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	border: none;
	background-color:var(--quiz-surface-muted);
	color:var(--color-text);
	cursor: pointer;
	text-align: left;
	position: relative;
    overflow: hidden;
	width: 100%;
	flex: 1;
	
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

    &:hover {
        background-color: var(--color-primary-bg) !important;

        ${TypePill} {
            border-color: var(--color-text);
        }
    }

	@media (max-width: 768px){
		padding:10px;
	}
`;

const LeftCardHeader = styled.div`
	display:flex;
	align-items:center;
	justify-content:space-between;
	flex-direction: row;
	gap: var(--spacing-xs);
`;

const LeftCardMain = styled.div`
	display:flex;
	align-items:center;
	justify-content:space-between;
	gap: var(--spacing-xs);
	width: 100%;
`;

const DragDock = styled.div`
	display:flex;
	align-items:center;
	justify-content:center;
	width: var(--spacing-l);
	height: var(--spacing-l);
	color: var(--color-placeholder);
	cursor:grab;
	
	&:hover{ 
		color: var(--color-primary-bg) 
	}
	&[data-dragging="true"]{
		opacity:.7;
		cursor:grabbing;
	}

	@media (max-width: 768px){
		width:28px;
		height:36px;
	}
`;

const LeftCardIndex = styled.p`
    font-size: var(--font-size-s);
    position: relative;
    top: 1px;
`;

const LeftCardTitle = styled.span`
	flex: 1;
	font-size: var(--font-size-s);
	font-weight: 400;
	overflow:hidden;
	white-space:nowrap;
	text-overflow:ellipsis;
	width: 100%;
`;

const CenterPanel = styled.section`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-l);

    /* This allows main content to scroll independently */
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

const TitleInput = styled(Input)`
    width: 100%;
    border: none;
    font-size: var(--font-size-3xl);
    line-height: var(--line-height-xl);
    font-weight: 500;
    color: var(--color-text);
    padding-left: 0;
    background: transparent!important;
    resize: none;
    overflow: hidden;
    height: auto;
    white-space: nowrap;
    text-overflow: ellipsis;
    outline: none;
`;

const DescTextarea = styled(TextArea)`
    width: 100%;
    border: none;
    font-size: var(--font-size);
    line-height: var(--line-height-2xl);
    background: transparent!important;
    font-weight: 500;
    padding-left: 0;
    color: var(--color-placeholder);
    resize: none;
    overflow: hidden;
    height: auto;
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

const QuestionList = styled.div`
	display:flex;
	flex-direction:column;
	gap:var(--spacing-s);
	flex:1;
	min-height:0;
	overflow-y:auto;
	align-items:center;
	width: 100%;
`;

const QuestionCard = styled.div`
	border:1px solid var(--quiz-border);
	border-radius:12px;
	background-color:var(--quiz-surface-muted);
	padding: var(--spacing);
	width:100%;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: var(--spacing-s);

`;

const QuestionHeader = styled.div`
	display:flex;
	align-items:center;
	justify-content:space-between;
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
		background-color: var(--color-error-bg-hover)!important;
		color: #000;
	}
`;

const OptionsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--spacing-s)
`;

const OptionsHeader = styled.div`
	font-size:var(--font-size);
	font-weight:500;
	color:var(--color-text);
`;

const OptionsContent = styled.div`
	display: flex;
	flex-direction: column;
`;

const OptionRow = styled.div`
	display:flex;
	flex-direction: row;
	align-items: center;
	gap: var(--spacing-xs);
	padding: var(--spacing-xs) var(--spacing);
	background-color:var(--quiz-surface);
	border-bottom: 1px solid var(--color-border);
	
	&:first-child {
        border-top-left-radius: var(--border-radius);
        border-top-right-radius: var(--border-radius);
	}
	
	&:last-child {
        border-bottom-left-radius: var(--border-radius);
        border-bottom-right-radius: var(--border-radius);
		border-bottom: none;
	}
`;

const OptionInput = styled(Input)`
	flex: 1;
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
	transition: all .2s ease;
	padding-top: 0;
	padding-bottom: 0;

	&:hover {
        background:transparent;
		color: var(--color-error-bg);
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