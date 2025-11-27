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
	Move,
	BadgeQuestionMark,
	Minus,
	ScrollText
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AddQuestionButton as SidebarAddQuestionButton } from "./LeftSidebar";

export default function QuestionsContent({
											 translation,
											 updateTranslationField,
											 questionRefs,
											 moveQuestion,
											 addSingleQuestion,
										 }) {
	const { t } = useTranslation();

	const updateQuestions = (updater) => {
		updateTranslationField((prevDraft) => ({
			...prevDraft,
			questions:
				typeof updater === "function" ? updater(prevDraft.questions || []) : updater,
		}));
	};

	const toggleCorrect = (id, idx) => {
		updateQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== id) return q;
				const s = new Set(q.correct_indices || []);
				s.has(idx) ? s.delete(idx) : s.add(idx);
				return { ...q, correct_indices: Array.from(s).sort((a, b) => a - b) };
			})
		);
	};

	const addOption = (id) => {
		updateQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== id) return q;
				const nextOpts = [...(q.options || []), ""];
				const nextIds  = [...(q.answerIds || []), null];
				return { ...q, options: nextOpts, answerIds: nextIds };
			})
		);
	};

	const deleteOption = (qId, idx) => {
		updateQuestions((prev) =>
			prev.map((x) => {
				if (x.id !== qId) return x;
				const newOptions = (x.options ?? []).filter((_, i) => i !== idx);
				const newAnswerIds = (x.answerIds ?? []).filter((_, i) => i !== idx);
				const nextCorrect = (x.correct_indices ?? [])
					.filter((i) => i !== idx)
					.map((i) => (i > idx ? i - 1 : i));
				return { ...x, options: newOptions, answerIds: newAnswerIds, correct_indices: nextCorrect };
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
				const nextIds     = [...(q.answerIds ?? [])];
				const [movedOpt]  = nextOptions.splice(from, 1);
				const [movedId]   = nextIds.splice(from, 1);
				nextOptions.splice(dropIndex, 0, movedOpt);
				nextIds.splice(dropIndex, 0, movedId);

				const oldCorrect = q.correct_indices ?? [];
				const newCorrect = oldCorrect
					.map((i) => {
						if (i === from) return dropIndex;
						if (from < dropIndex && i > from && i <= dropIndex) return i - 1;
						if (from > dropIndex && i >= dropIndex && i < from) return i + 1;
						return i;
					})
					.sort((a, b) => a - b);

				return { ...q, options: nextOptions, answerIds: nextIds, correct_indices: newCorrect };
			})
		);
	};

	const onOptionDragEnd = () => {
		setDragState({ draggingQId: null, draggingIdx: null, overQId: null, overIdx: null });
	};

	const questions = translation.questions || [];

	if (questions.length === 0) {
		return (
			<DropPlaceholder>
				<SidebarAddQuestionButton type="button" onClick={addSingleQuestion}>
					<BadgeQuestionMark size={18} /> {t("actions.addQuestion")}
				</SidebarAddQuestionButton>
			</DropPlaceholder>
		);
	}

	return (
		<Container>
			{questions.map((q, index) => {
				const correctCount = q?.correct_indices?.length || 0;
				const tagBadge = correctCount > 0;
				return (
					<QuestionCard key={q.id} ref={(el) => (questionRefs.current[q.id] = el)}>
						<CardHeader>
							<QuestionLabel>
								<BadgeQuestionMark size={20} color={"var(--color-text-muted)"} />{" "}
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

								<HeaderDivider />

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
									variant={"link"}
									size={"s"}
									onClick={() =>
										updateQuestions((prev) =>
											prev.map((x) => (x.id === q.id ? { ...x, showDescription: true } : x))
										)
									}
								>
									<ScrollText size={16} /> {t("quiz.add_description") || "Ajouter une description"}
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
											<Move size={16} />
										</DragHandle>
										<OptionContent>
											<CheckBox
												checked={(q.correct_indices || []).includes(idx)}
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

								<AddOptionBtn type="button" size={"s"} onClick={() => addOption(q.id)}>
									<Plus size={16} /> {t("quiz.options.new") || "Ajouter une option"}
								</AddOptionBtn>
							</AnswersContent>
						</CardBody>
					</QuestionCard>
				);
			})}

			<Button onClick={addSingleQuestion} style={{ width: "fit-content" }}>
				<BadgeQuestionMark size={18} /> {t("actions.addQuestion")}
			</Button>
		</Container>
	);
}


/* Styled Components */
const Container = styled.div`
    display: flex;
	flex-direction: column;
	gap: var(--spacing-l);
`;

const DropPlaceholder = styled.div`
    min-height:160px;
    border: 1px dashed var(--color-border);
    border-radius: var(--border-radius-xs);
    display:flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-s);
    background-color: var(--color-input-background, #f9f9f9);
    width:100%;

    @media (max-width: 768px){
        height:140px;
    }
`;

const QuestionCard = styled.div`
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-xs);
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
    background-color: var(--color-background-surface-2);
    height: 58px;
`;

const QuestionLabel = styled.p`
    font-size: var(--font-size);
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	line-height: 20px;
`;

const HeaderActions = styled.div`
    display: inline-flex;
    align-items: center;
    margin-left: auto;
`;

const HeaderDivider = styled.div`
    width: 1px;
    height: 24px;
    background: var(--color-divider);
    margin: 0 var(--spacing-xs);
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
    color: var(--color-text-muted);
	cursor: pointer;
	margin-left: auto;
	padding-right: 0;
	font-size: var(--font-size-s);
	transition: color 0.2s ease;
	align-self: flex-start;
	gap: var(--spacing-xs);

	&:hover:not(:disabled) {
        background: none;
		color: var(--color-error-bg-hover, darkred);
	}
`;

const AddDescriptionLink = styled(Button)`
	margin-bottom: var(--spacing-xs);
	color: var(--color-text-muted);
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
    padding: var(--spacing-s) var(--spacing-s);
    border: 1px solid var(--color-border);
    font-size: var(--font-size-xs);
    font-weight: 500;
    border-radius: var(--border-radius-xs);
    background: var(--color-primary-muted);
    color: var(--color-text-muted);
	margin-right: var(--spacing-s);
`;

const IconButton = styled(Button)`
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    padding: var(--spacing-xs);
    line-height: 0;
    transition: color .2s ease;
	border-radius: var(--border-radius-xs);
	
    &:hover:not(:disabled) {
        background: transparent !important;
        color: var(--color-primary-bg);
		border: 1px solid var(--color-primary-bg);
    }

    &:active {
        transform: scale(0.92);
    }

    &:disabled {
        color: var(--color-disabled);
        cursor: default;
        pointer-events: none;
		opacity: 0.3;
    }
`;

const IconDelButton = styled(Button)`
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--border-radius-xs);
    line-height: 0;
    transition: color .2s ease;

    &:hover:not(:disabled) {
        background: transparent !important;
        color: var(--color-error-bg);
        border: 1px solid var(--color-error-bg);
    }

    &:active {
        transform: scale(0.92);
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
    gap: var(--spacing-xs);
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
    gap: var(--spacing-2xs);
    background-color: var(--color-background-muted);
    border-radius: var(--border-radius-xs);
    padding: var(--spacing-2xs) var(--spacing);
`;

const RemoveOpt = styled(Button)`
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--border-radius-xs);
    line-height: 0;
    transition: color .2s ease;

    &:hover:not(:disabled) {
        background: transparent !important;
        color: var(--color-error-bg);
        border: 1px solid var(--color-error-bg);
    }

    &:active {
        transform: scale(0.92);
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
    color: var(--color-text-muted);
`;
