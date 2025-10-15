import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { GripVertical } from "lucide-react";
import Button from "../../components/ui/Button";
import { useTranslation } from "react-i18next";

export default function Sidebar({ questions, questionRefs, setQuestions, setIsDirty, untitled }) {
	const { t } = useTranslation();

	// Drag and Drop
	const [draggingIndex, setDraggingIndex] = useState(null);
	const [overIndex, setOverIndex] = useState(null);

	const scrollToQuestion = (id) => {
		const el = questionRefs.current[id];
		el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
	};

	// Handlers DnD
	const onDragStart = useCallback((e, index) => {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", String(index));
		setDraggingIndex(index);
	}, []);

	const onDragOver = useCallback((e, index) => {
		e.preventDefault();
		setOverIndex(index);
	}, []);

	const onDrop = useCallback(
		(e, dropIndex) => {
		e.preventDefault();
		const from = Number(e.dataTransfer.getData("text/plain"));
		if (Number.isNaN(from) || from === dropIndex) {
			setDraggingIndex(null);
			setOverIndex(null);
			return;
		}

		setQuestions((prev) => {
			const next = [...prev];
			const [moved] = next.splice(from, 1);
			next.splice(dropIndex, 0, moved);
			return next;
		});
		setIsDirty(true);
		setDraggingIndex(null);
		setOverIndex(null);
		},
		[setQuestions, setIsDirty]
	);

	const onDragEnd = useCallback(() => {
		setDraggingIndex(null);
		setOverIndex(null);
	}, []);

	return (
		<LeftPanel>
		<LeftTitle>{t("quiz.sections.questions")}</LeftTitle>

		<AddQuestionButton
			onClick={() => {
			const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
			const newQ = { id, title: "", description: "", options: ["Option 1", "Option 2"], correctIndices: [] };
			setQuestions((prev) => [...prev, newQ]);
			setIsDirty(true);
			setTimeout(() => scrollToQuestion(id), 0);
			}}
		>
			{t("actions.addQuestion")}
		</AddQuestionButton>

		<LeftList>
			{questions.map((q, idx) => {
			const isDragging = draggingIndex === idx;
			const isOver = overIndex === idx;
			return (
				<LeftRow
				key={q.id}
				draggable
				onDragStart={(e) => onDragStart(e, idx)}
				onDragOver={(e) => onDragOver(e, idx)}
				onDrop={(e) => onDrop(e, idx)}
				onDragEnd={onDragEnd}
				data-dragging={isDragging ? "1" : undefined}
				data-over={isOver ? "1" : undefined}
				onClick={() => scrollToQuestion(q.id)}
				title={q.title?.trim() ? q.title : untitled}
				>
				<DragDock title={t("quiz.hints.dragToReorder")}>
					<GripVertical size={16} />
				</DragDock>
				<LeftCard>
					<LeftCardHeader>
						<LeftCardIndex>{idx + 1}</LeftCardIndex>
					</LeftCardHeader>
					<LeftCardMain>
						<LeftCardTitle>{q.title?.trim() ? q.title : untitled}</LeftCardTitle>
					</LeftCardMain>
				</LeftCard>
				</LeftRow>
			);
			})}
		</LeftList>
		</LeftPanel>
	);
}

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

	scrollbar-width: thin;
	scrollbar-color: var(--color-primary) var(--quiz-surface-muted);

	&::-webkit-scrollbar {
		width: 8px;
	}

	&::-webkit-scrollbar-track {
		background: var(--quiz-surface-muted);
		border-radius: 8px;
	}

	&::-webkit-scrollbar-thumb {
		background-color: var(--color-primary);
		border-radius: 8px;
		border: 2px solid var(--quiz-surface-muted);
	}

	&::-webkit-scrollbar-thumb:hover {
		background-color: var(--color-primary-hover);
	}
`;

const LeftTitle = styled.h2`
	font-size: var(--font-size);
	font-weight: 600;
	margin: 0;
`;

export const AddQuestionButton = styled(Button)`
	@media (max-width: 768px) {
		width: 100%;
		justify-content: center;
	}
`;

const LeftList = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	user-select: none;
	flex: 1;
	min-height: 0;
`;

const LeftRow = styled.div`
	display: flex;
	width: 100%;
	align-items: center;
	gap: var(--spacing-xs);
	cursor: grab;

	&[data-dragging="1"] {
		opacity: 0.6;
	}
	&[data-over="1"] {
		outline: 2px dashed var(--color-primary-bg);
		border-radius: 8px;
	}
`;

const DragDock = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--spacing-l);
	height: var(--spacing-l);
	color: var(--color-placeholder);
`;

const LeftCard = styled(Button)`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	border: none;
	background-color: var(--quiz-surface-muted);
	color: var(--color-text);
	cursor: pointer;
	text-align: left;
	width: 100%;
	flex: 1;
    overflow: auto;
`;

const LeftCardHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const LeftCardMain = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-xs);
	width: 100%;
    line-height: normal;
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
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	width: 100%;
`;
