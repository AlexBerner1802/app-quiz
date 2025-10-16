import React from "react";
import styled from "styled-components";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TextArea from "../../components/ui/TextArea";
import CheckBox from "../../components/ui/CheckBox";
import { Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Content({
	questions,
	setQuestions,
	setIsDirty,
	questionRefs,
	}) {
	const { t } = useTranslation();

	const toggleCorrect = (id, idx) => {
		setQuestions((prev) =>
		prev.map((q) => {
			if (q.id !== id) return q;
			const s = new Set(q.correctIndices || []);
			s.has(idx) ? s.delete(idx) : s.add(idx);
			return { ...q, correctIndices: Array.from(s).sort((a, b) => a - b) };
		})
		);
		setIsDirty(true);
	};

	const addOption = (id) => {
		setQuestions((prev) =>
		prev.map((q) => {
			if (q.id !== id) return q;
			const base = t("quiz.defaults.option") || "Option";
			const nextIndex = (q.options?.length || 0) + 1;
			return { ...q, options: [...(q.options || []), `${base} ${nextIndex}`] };
		})
		);
		setIsDirty(true);
	};

	const deleteOption = (qId, idx) => {
		setQuestions((prev) =>
		prev.map((x) => {
			if (x.id !== qId) return x;
			const newOptions = (x.options ?? []).filter((_, i) => i !== idx);
			const nextCorrect = (x.correctIndices ?? [])
			.filter((i) => i !== idx)
			.map((i) => (i > idx ? i - 1 : i));
			return { ...x, options: newOptions, correctIndices: nextCorrect };
		})
		);
		setIsDirty(true);
	};

	const deleteQuestion = (id) => {
		setQuestions((prev) => prev.filter((q) => q.id !== id));
		setIsDirty(true);
		// Optionnel : nettoyer la ref
		if (questionRefs?.current) delete questionRefs.current[id];
	};

	const correctModeLabel = (count) => {
		if (count <= 0) return "";
		if (count === 1) return t("quiz.labels.single") || "Single";
		return t("quiz.labels.multi") || "Multi";
	};

	return (
		<CenterInner>
		{questions.map((q) => {
			const correctCount = q?.correctIndices?.length || 0;
			const tagBadge = correctCount > 0;
			return (
			<QuestionCard key={q.id} ref={(el) => (questionRefs.current[q.id] = el)}>
				<CardHeader>
				<QuestionTitleInput
					value={q.title}
					placeholder={t("quiz.placeholders.title")}
					onChange={(e) =>
					setQuestions((prev) =>
						prev.map((x) => (x.id === q.id ? { ...x, title: e.target.value } : x))
					)
					}
				/>
				<HeaderActions>
					{tagBadge && <ModeBadge data-multi={correctCount > 1 ? "1" : undefined}>
					{correctModeLabel(correctCount)}
					</ModeBadge>}
					<IconButton
					type="button"
					onClick={() => deleteQuestion(q.id)}
					title={t("actions.deleteQuestion") || "Supprimer la question"}
					aria-label={t("actions.deleteQuestion") || "Supprimer la question"}
					>
					<Trash2 size={18} />
					</IconButton>
				</HeaderActions>
				</CardHeader>

				<QuestionDescTextArea
				value={q.description}
				placeholder={t("quiz.sections.descriptionAdd")}
				rows={2}
				onChange={(e) =>
					setQuestions((prev) =>
					prev.map((x) => (x.id === q.id ? { ...x, description: e.target.value } : x))
					)
				}
				/>

				{(q.options || []).map((opt, idx) => (
				<OptionRow key={idx}>
					<CheckBox
					checked={(q.correctIndices || []).includes(idx)}
					onChange={() => toggleCorrect(q.id, idx)}
					/>
					<OptionInput
					value={opt}
					onChange={(e) =>
						setQuestions((prev) =>
						prev.map((x) => {
							if (x.id !== q.id) return x;
							const next = [...(x.options ?? [])];
							next[idx] = e.target.value;
							return { ...x, options: next };
						})
						)
					}
					/>
					<RemoveOpt
					type="button"
					onClick={() => deleteOption(q.id, idx)}
					title={t("actions.deleteAnswer") || "Supprimer la réponse"}
					aria-label={t("actions.deleteAnswer") || "Supprimer la réponse"}
					>
					<Trash2 size={16} />
					</RemoveOpt>
				</OptionRow>
				))}

				<CardFooter>
				<AddOptionBtn type="button" onClick={() => addOption(q.id)}>
					<Plus size={16} /> {t("actions.addOption") || "Ajouter une option"}
				</AddOptionBtn>
				</CardFooter>
			</QuestionCard>
			);
		})}
		</CenterInner>
	);
}

/* Styled Components */
const CenterInner = styled.div`
	width: 100%;
	max-width: var(--spacing-12xl);
	margin: 0 auto var(--spacing) auto;
	gap: var(--spacing);
	display: flex;
	flex-direction: column;
`;

const QuestionCard = styled.div`
	border: 1px solid var(--quiz-border);
	border-radius: 12px;
	background-color: var(--color-surface);
	padding: var(--spacing);
	width: 100%;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: var(--spacing-s);
`;

const CardHeader = styled.div`
	display: flex;
	align-items: flex-start;
	gap: var(--spacing);
`;

const HeaderActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-xs);
	margin-left: auto;
`;

const ModeBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	font-size: var(--font-size-xs);
	font-weight: 600;
	border-radius: 999px;
	background: var(--color-primary-muted);
	color: var(--color-primary-text);

	/* teinte différente si multi */
	&[data-multi="1"] {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}
`;

const IconButton = styled(Button)`
	border: none;
	background: transparent;
	color: var(--color-text);
	cursor: pointer;
	padding: 6px;
	border-radius: 8px;
	line-height: 0;
	transition: color .15s ease;
	&:hover {
		background: transparent !important;
		color: var(--color-error-bg) !important;
	}
`;

const QuestionTitleInput = styled(Input)`
    background-color: var(--color-background-input);
	margin-right: 30px;
`;

const QuestionDescTextArea = styled(TextArea)`
	background-color: var(--color-background-input);
	margin: 7px;
`;

const OptionRow = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10px;
`;

const OptionInput = styled(Input)`
	flex: 1;
	border: none;
	background: var(--color-background-surface);
	outline: none;
	color: var(--color-text);
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

const CardFooter = styled.div`
	display: flex;
	justify-content: flex-start;
`;

const AddOptionBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	border: 1px dashed var(--color-border);
	background: var(--quiz-surface);
	color: var(--color-text);
	padding: 8px 10px;
	border-radius: 10px;
	cursor: pointer;
	transition: background .15s ease, border-color .15s ease;
	&:hover {
		background: var(--quiz-surface-muted);
		border-color: var(--color-primary-bg);
	}
`;
