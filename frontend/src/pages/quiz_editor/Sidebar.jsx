import React from "react";
import styled from "styled-components";
import { GripVertical } from "lucide-react";
import Button from "../../components/ui/Button";

export default function Sidebar({ questions, questionRefs, setQuestions, setIsDirty, untitled }) {
	const scrollToQuestion = (id) => {
		const el = questionRefs.current[id];
		el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
	};

	return (
		<LeftPanel>
			<LeftTitle>Questions</LeftTitle>

			<AddQuestionButton
				type="button"
				onClick={() => {
					const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
					const newQ = { id, title: "", description: "", options: ["Option 1", "Option 2"], correctIndices: [] };
					setQuestions((prev) => [...prev, newQ]);
					setIsDirty(true);
					setTimeout(() => scrollToQuestion(id), 0);
				}}
			>
				Add Question
			</AddQuestionButton>

			<LeftList>
				{questions.map((q, idx) => (
					<LeftRow key={q.id} onClick={() => scrollToQuestion(q.id)}>
						<DragDock>
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
				))}
			</LeftList>
		</LeftPanel>
	);
}

/* Styled Components for Sidebar */
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
`;

const LeftTitle = styled.h2`
  font-size: var(--font-size);
  font-weight: 600;
  margin: 0;
`;

const AddQuestionButton = styled(Button)`
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const LeftList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
  user-select: none;
  flex: 1;
  min-height: 0;
`;

const LeftRow = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--spacing-xs);
`;

const DragDock = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--spacing-l);
  height: var(--spacing-l);
  color: var(--color-placeholder);
  cursor: grab;
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
