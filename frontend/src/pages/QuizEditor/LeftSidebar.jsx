// QuizEditor/LeftSidebar.jsx

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import {BadgeQuestionMark, Move, SquareChevronLeft} from "lucide-react";
import Button from "../../components/ui/Button";
import { useTranslation } from "react-i18next";

export default function LeftSidebar({
										drafts,
										currentLang,
										questionRefs,
										addSingleQuestion,
										setDrafts,
										visible = true,
										onHide,
									}) {
	const { t } = useTranslation();

	const untitled = useMemo(
		() => t("quiz.placeholders.untitled") || t("common.untitled") || "Sans titre",
		[t]
	);

	const draft = drafts[currentLang];
	const questions = draft?.questions || [];

	const [draggingIndex, setDraggingIndex] = useState(null);
	const [overIndex, setOverIndex] = useState(null);

	// Scroll to question in CenterPanel
	const scrollToQuestion = (id) => {
		const el = questionRefs.current[id];
		if (el?.scrollIntoView) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			// optional: highlight briefly
			el.style.transition = "background-color 0.3s";
			el.style.backgroundColor = "rgba(255, 235, 59, 0.3)";
			setTimeout(() => (el.style.backgroundColor = ""), 300);
		}
	};

	// Drag & Drop handlers
	const onDragStart = (e, index) => {
		e.dataTransfer.effectAllowed = "move";
		setDraggingIndex(index);
	};

	const onDragOverRow = (e, index) => {
		e.preventDefault();
		if (index !== overIndex) setOverIndex(index);
	};

	const onDropRow = () => {
		if (draggingIndex === null || overIndex === null) return;

		setDrafts((prev) => {
			const draft = prev[currentLang];
			const nextQuestions = [...draft.questions];
			const [moved] = nextQuestions.splice(draggingIndex, 1);
			nextQuestions.splice(overIndex, 0, moved);

			return {
				...prev,
				[currentLang]: {
					...draft,
					questions: nextQuestions,
					isDirty: true,
				},
			};
		});

		setDraggingIndex(null);
		setOverIndex(null);
	};

	return (
		<SidebarWrapper $visible={visible}>
			<LeftPanel>
				<Header>
					<LeftTitle>
						<BadgeQuestionMark size={22} />
						{t("quiz.sections.questions")}
					</LeftTitle>
					<HideButton onClick={onHide}>
						<SquareChevronLeft size={24} color={"var(--color-text)"} />
					</HideButton>
				</Header>

				<Button variant={"outline"} onClick={addSingleQuestion}>
					<BadgeQuestionMark size={18} /> {t("actions.addQuestion")}
				</Button>

				<LeftList>
					{questions.map((q, idx) => {
						const isDragging = draggingIndex === idx;
						const isOver = overIndex === idx;
						return (
							<LeftRow
								key={q.id}
								draggable
								onDragStart={(e) => onDragStart(e, idx)}
								onDragOver={(e) => onDragOverRow(e, idx)}
								onDrop={onDropRow}
								onDragEnd={() => {
									setDraggingIndex(null);
									setOverIndex(null);
								}}
								data-dragging={isDragging ? "1" : undefined}
								data-over={isOver ? "1" : undefined}
								onClick={() => scrollToQuestion(q.id)}
							>
								<DragDock title={t("quiz.hints.dragToReorder")}>
									<Move size={16} />
								</DragDock>
								<LeftCard>
									<LeftCardHeader>
										<LeftCardIndex>{ t("quiz.question") + " " + (idx + 1)}</LeftCardIndex>
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
		</SidebarWrapper>
	);
}

/* Styled Components */
const SidebarWrapper = styled.div`
    position: relative;
    transition: transform 0.3s ease;
    transform: ${({ $visible }) => ($visible ? "translateX(0)" : "translateX(-100%)")};
    flex-shrink: 0;
    z-index: 20;
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
    background-color: var(--color-background-muted);
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary-bg) var(--color-background-muted);
    &::-webkit-scrollbar {
        width: 8px;
    }
    &::-webkit-scrollbar-track {
        background: var(--color-background-muted);
        border-radius: 8px;
    }
    &::-webkit-scrollbar-thumb {
        background-color: var(--color-primary-bg);
        border-radius: 8px;
        border: 2px solid var(--color-background-muted);
    }
    &::-webkit-scrollbar-thumb:hover {
        background-color: var(--color-primary-bg-hover);
    }
`;

const Header = styled.div`
    display:flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-2xs);
`;

const LeftTitle = styled.h2`
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size);
    color: var(--color-text-muted);
    font-weight: 600;
    margin: 0;
`;

const HideButton = styled.div`
    cursor: pointer;
    &:hover {
        svg {
            transition: all .2s ease;
            stroke: var(--color-primary-bg);
        }
    }
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
`;

const LeftRow = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--spacing);
    transition: all .2s ease;
    border-radius: var(--border-radius-xs);
	background-color: var(--color-background-alt);
	border: 1px solid var(--color-background-alt);
    padding: var(--spacing);
    cursor: grab;
    &[data-dragging="1"] {
        opacity: 1;
        transform: scale(1.05);
    }
    &[data-over="1"] {
        outline: 1px dashed var(--color-primary-bg);
        border-radius: 8px;
        transform: scale(0.98);
        opacity: 0.4;
    }

    &:hover {
        border: 1px solid var(--color-primary-bg);
        background-color: var(--color-primary-muted);
        color: var(--color-primary-bg);
    }
`;

const DragDock = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--spacing-l);
    height: var(--spacing-l);
    color: var(--color-text-muted);
`;

const LeftCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    background-color: transparent;
	border: none;
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
	font-weight: 500;
`;

const LeftCardTitle = styled.span`
    flex: 1;
    font-size: var(--font-size-s);
    color: var(--color-text-muted);
    font-weight: 400;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 100%;
	min-height: var(--spacing);
`;
