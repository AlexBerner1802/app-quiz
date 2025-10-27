import React from "react";
import styled from "styled-components";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TextArea from "../../components/ui/TextArea";
import CheckBox from "../../components/ui/CheckBox";
import {
	Trash2,
	Plus,
	ArrowUp,
	ArrowDown,
	GripVertical,
	BadgeQuestionMark,
	Minus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AddQuestionButton as SidebarAddQuestionButton } from "./LeftSidebar";

export default function QuestionsContent({
											 draft,
											 updateDraft,
											 questionRefs,
											 moveQuestion,
											 addSingleQuestion,
										 }) {
	const { t } = useTranslation();
	const [draggingOptionIndex, setDraggingOptionIndex] = React.useState(null);
	const [overOptionIndex, setOverOptionIndex] = React.useState(null);

	const updateQuestions = (updater) => {
		updateDraft((prevDraft) => ({
			...prevDraft,
			questions:
				typeof updater === "function" ? updater(prevDraft.questions || []) : updater,
		}));
	};

	const toggleCorrect = (id, idx) => {
		updateQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== id) return q;
				const s = new Set(q.correctIndices || []);
				s.has(idx) ? s.delete(idx) : s.add(idx);
				return { ...q, correctIndices: Array.from(s).sort((a, b) => a - b) };
			})
		);
	};

	const addOption = (id) => {
		updateQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== id) return q;
				return { ...q, options: [...(q.options || []), ""] };
			})
		);
	};

	const deleteOption = (qId, idx) => {
		updateQuestions((prev) =>
			prev.map((x) => {
				if (x.id !== qId) return x;
				const newOptions = (x.options ?? []).filter((_, i) => i !== idx);
				const nextCorrect = (x.correctIndices ?? [])
					.filter((i) => i !== idx)
					.map((i) => (i > idx ? i - 1 : i));
				return { ...x, options: newOptions, correctIndices: nextCorrect };
			})
		);
	};

	const deleteQuestion = (id) => {
		updateQuestions((prev) => prev.filter((q) => q.id !== id));
		if (questionRefs?.current) delete questionRefs.current[id];
	};

	const correctModeLabel = (count) => {
		if (count <= 0) return "";
		if (count === 1) return t("quiz.labels.single") || "Single";
		return t("quiz.labels.multi") || "Multi";
	};

	const [dragState, setDragState] = React.useState({
		draggingQId: null,
		draggingIdx: null,
		overQId: null,
		overIdx: null,
	});

	const onOptionDragStart = (e, qId, index) => {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", String(index));
		setDragState({ draggingQId: qId, draggingIdx: index, overQId: null, overIdx: null });
	};

	const onOptionDragOver = (e, qId, index) => {
		e.preventDefault();
		setDragState((prev) => ({ ...prev, overQId: qId, overIdx: index }));
	};

	const onOptionDrop = (e, qId, dropIndex) => {
		e.preventDefault();
		const from = Number(e.dataTransfer.getData("text/plain"));
		setDragState({ draggingQId: null, draggingIdx: null, overQId: null, overIdx: null });

		if (Number.isNaN(from) || from === dropIndex) return;

		updateQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== qId) return q;

				const nextOptions = [...(q.options ?? [])];
				const [moved] = nextOptions.splice(from, 1);
				nextOptions.splice(dropIndex, 0, moved);

				const oldCorrect = q.correctIndices ?? [];
				const newCorrect = oldCorrect
					.map((i) => {
						if (i === from) return dropIndex;
						if (from < dropIndex && i > from && i <= dropIndex) return i - 1;
						if (from > dropIndex && i >= dropIndex && i < from) return i + 1;
						return i;
					})
					.sort((a, b) => a - b);

				return { ...q, options: nextOptions, correctIndices: newCorrect };
			})
		);
	};

	const onOptionDragEnd = () => {
		setDragState({ draggingQId: null, draggingIdx: null, overQId: null, overIdx: null });
	};

	const questions = draft.questions || [];

	if (questions.length === 0) {
		return (
			<DropPlaceholder>
				<SidebarAddQuestionButton type="button" onClick={addSingleQuestion}>
					<Plus size={16} /> {t("actions.addQuestion")}
				</SidebarAddQuestionButton>
			</DropPlaceholder>
		);
	}

	return (
		<Container>
			{questions.map((q, index) => {
				const correctCount = q?.correctIndices?.length || 0;
				const tagBadge = correctCount > 0;
				return (
					<QuestionCard key={q.id} ref={(el) => (questionRefs.current[q.id] = el)}>
						<CardHeader>
							<QuestionLabel>
								<BadgeQuestionMark size={20} color={"var(--color-placeholder)"} />{" "}
								{t("quiz.question")} {index + 1}
							</QuestionLabel>
							<HeaderActions>
								{tagBadge && (
									<ModeBadge data-multi={correctCount > 1 ? "1" : undefined}>
										{correctModeLabel(correctCount)}
									</ModeBadge>
								)}
								<IconButton
									type="button"
									onClick={() => moveQuestion(index, "up")}
									disabled={index === 0}
								>
									<ArrowUp size={18} />
								</IconButton>

								<IconButton
									type="button"
									onClick={() => moveQuestion(index, "down")}
									disabled={index === questions.length - 1}
								>
									<ArrowDown size={18} />
								</IconButton>
								<IconDelButton type="button" onClick={() => deleteQuestion(q.id)}>
									<Trash2 size={18} />
								</IconDelButton>
							</HeaderActions>
						</CardHeader>

						<CardBody>
							<Input
								value={q.title}
								width={"100%"}
								placeholder={t("quiz.question")}
								onChange={(e) =>
									updateQuestions((prev) =>
										prev.map((x) => (x.id === q.id ? { ...x, title: e.target.value } : x))
									)
								}
							/>

							{(!q.showDescription && !q.description) ? (
								<AddDescriptionLink
									type="button"
									onClick={() =>
										updateQuestions((prev) =>
											prev.map((x) => (x.id === q.id ? { ...x, showDescription: true } : x))
										)
									}
								>
									<Plus size={16} /> {t("quiz.add_description") || "Ajouter une description"}
								</AddDescriptionLink>
							) : (
								<DescriptionWrapper>
									<TextArea
										width={"100%"}
										value={q.description || ""}
										placeholder={t("quiz.description")}
										onChange={(e) =>
											updateQuestions((prev) =>
												prev.map((x) =>
													x.id === q.id ? { ...x, description: e.target.value } : x
												)
											)
										}
									/>
									<RemoveDescriptionLink
										type="button"
										onClick={() =>
											updateQuestions((prev) =>
												prev.map((x) =>
													x.id === q.id ? { ...x, description: "", showDescription: false } : x
												)
											)
										}
									>
										<Minus size={16} /> {t("quiz.remove_description") || "Supprimer la description"}
									</RemoveDescriptionLink>
								</DescriptionWrapper>
							)}

							<AnswersContent>
								<AnswersLabel>{t("quiz.answers")}</AnswersLabel>

								{(q.options || []).map((opt, idx) => (
									<OptionRow
										key={idx}
										draggable
										onDragStart={(e) => onOptionDragStart(e, q.id, idx)}
										onDragOver={(e) => onOptionDragOver(e, q.id, idx)}
										onDrop={(e) => onOptionDrop(e, q.id, idx)}
										onDragEnd={onOptionDragEnd}
										data-dragging={
											dragState.draggingQId === q.id && dragState.draggingIdx === idx ? "1" : undefined
										}
										data-over={
											dragState.overQId === q.id && dragState.overIdx === idx ? "1" : undefined
										}
									>
										<DragHandle title="Drag to reorder">
											<GripVertical size={16} />
										</DragHandle>
										<OptionContent>
											<CheckBox
												checked={(q.correctIndices || []).includes(idx)}
												onChange={() => toggleCorrect(q.id, idx)}
											/>
											<TextArea
												rows={1}
												width={"100%"}
												value={opt || ""}
												hideFocus
												inputWrapperStyle={{ border: "none" }}
												placeholder={`${t("quiz.defaults.option") || "Option"} ${idx + 1}`}
												onChange={(e) =>
													updateQuestions((prev) =>
														prev.map((x) => {
															if (x.id !== q.id) return x;
															const next = [...(x.options ?? [])];
															next[idx] = e.target.value;
															return { ...x, options: next };
														})
													)
												}
											/>
										</OptionContent>

										<RemoveOpt
											type="button"
											onClick={() => deleteOption(q.id, idx)}
											title={t("actions.deleteAnswer") || "Supprimer la réponse"}
										>
											<Trash2 size={16} />
										</RemoveOpt>
									</OptionRow>
								))}

								<AddOptionBtn type="button" onClick={() => addOption(q.id)}>
									<Plus size={16} /> {t("quiz.options.new") || "Ajouter une option"}
								</AddOptionBtn>
							</AnswersContent>
						</CardBody>
					</QuestionCard>
				);
			})}

			<Button onClick={addSingleQuestion} style={{ width: "fit-content" }}>
				<Plus size={16} /> {t("actions.addQuestion")}
			</Button>
		</Container>
	);
}


/* Styled Components */
const Container = styled.div`
    display: flex;
	flex-direction: column;
	gap: var(--spacing-s);
`;

const DropPlaceholder = styled.div`
    min-height:160px;
    border: 1px dashed var(--color-border);
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

const QuestionCard = styled.div`
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-l);
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: var(--spacing);
    padding: var(--spacing);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-background-surface);
    height: 58px;
`;

const QuestionLabel = styled.p`
    font-size: var(--font-size);
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	line-height: 20px;
`;

const HeaderActions = styled.div`
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-left: auto;
`;

const CardBody = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-s);
    padding: var(--spacing);
`;

const DescriptionWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--spacing-2xs);
	width: 100%;
`;

const RemoveDescriptionLink = styled.button`
    display: flex;
    align-items: center;
	background: none;
	border: none;
    color: var(--color-placeholder);
	cursor: pointer;
	margin-left: auto;
	padding-right: 0;
	font-size: var(--font-size-s);
	transition: color 0.2s ease;
	align-self: flex-start;
	gap: var(--spacing-xs);

	&:hover {
        background: none;
		color: var(--color-error-bg-hover, darkred);
	}
`;

const AddDescriptionLink = styled.button`
	display: flex;
	align-items: center;
	background: none;
	border: none;
	color: var(--color-placeholder);
	cursor: pointer;
	margin-top: calc(-1 * var(--spacing-xs));
    padding-left: 0;
	font-size: var(--font-size-s);
	transition: color 0.2s ease;
	align-self: flex-start;
    gap: var(--spacing-xs);

	&:hover {
		background: none;
		color: var(--color-primary-bg-hover);
	}
`;


const AnswersContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    width: 100%;
`;

const AnswersLabel = styled.p`
    font-size: var(--font-size);
    margin-top: var(--spacing-xs);
`;

const ModeBadge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--color-border);
    font-size: var(--font-size-xs);
    font-weight: 600;
    border-radius: var(--border-radius-full);
    background: var(--color-primary-muted);
    color: var(--color-primary-text);
`;

const IconButton = styled(Button)`
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    padding: var(--spacing-2xs);
    border-radius: 8px;
    line-height: 0;
    transition: color .15s ease;
    &:hover {
        background: transparent !important;
        color: var(--color-primary-bg-hover);
    }

    &:disabled {
        cursor: default;
        pointer-events: none;
		opacity: 0.3;
    }
`;

const IconDelButton = styled(Button)`
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    padding: var(--spacing-2xs);
    border-radius: 8px;
    line-height: 0;
    transition: color .15s ease;
    &:hover {
        background: transparent !important;
        color: var(--color-error-bg);
    }

    &:disabled {
        cursor: default;
        pointer-events: none;
    }
`;


const OptionRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    gap: var(--spacing-2xs);
    cursor: grab;
    user-select: none;
    transition: all .2s ease;

    &[data-dragging="1"] {
        opacity: 1;
        transform: scale(1.02);
    }

    &[data-over="1"] {
        outline: 1px dashed var(--color-primary-bg);
        border-radius: 8px;
        transform: scale(0.98);
        opacity: 0.4;
    }
`;

const OptionContent = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    gap: var(--spacing-xs);
    background-color: var(--color-surface);
    border-radius: var(--border-radius);
    padding: var(--spacing-2xs) var(--spacing);
`;

const RemoveOpt = styled(Button)`
    border: none;
    background: transparent;
    color: var(--color-text) !important;
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover {
        background: transparent !important;
        color: var(--color-error-bg) !important;
    }
`;

const AddOptionBtn = styled(Button)`
	margin-left: auto;
`;

const DragHandle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    padding: 0 4px;
    color: var(--color-placeholder);
`;
