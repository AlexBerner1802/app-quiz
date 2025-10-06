import React from "react";
import styled from "styled-components";
import Input from "../../components/ui/Input";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import CheckBox from "../../components/ui/CheckBox";
import TagInput from "../../components/ui/TagInput";
import CheckboxGroup from "../../components/ui/CheckboxGroup";
import ImageUploader from "../../components/ui/ImageUploader";
import { Plus, Trash2 } from "lucide-react";

export default function Content({
									questions,
									setQuestions,
									setIsDirty,
									title,
									setTitle,
									quiz_description,
									setQuizDescription,
									modules,
									selectedModuleIds,
									setSelectedModuleIds,
									selectedTags,
									setSelectedTags,
									selectedTagIds,
									setSelectedTagIds,
									questionRefs,
								}) {
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

	return (
		<CenterPanel>
			<CenterInner>
				<Input
					value={title}
					width={"100%"}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Enter quiz title..."
				/>
				<TextArea
					value={quiz_description}
					width={"100%"}
					onChange={(e) => {
						setQuizDescription(e.target.value);
						setIsDirty(true);
					}}
					placeholder="Quiz description..."
					rows={2}
				/>

				{questions.map((q) => (
					<QuestionCard key={q.id} ref={(el) => (questionRefs.current[q.id] = el)}>
						<Input
							value={q.title}
							width={"100%"}
							onChange={(e) => setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, title: e.target.value } : x)))}
						/>
						<TextArea
							value={q.description}
							width={"100%"}
							onChange={(e) =>
								setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, description: e.target.value } : x)))
							}
							rows={3}
						/>

						{(q.options || []).map((opt, idx) => (
							<OptionRow key={idx}>
								<CheckBox checked={(q.correctIndices || []).includes(idx)} onChange={() => toggleCorrect(q.id, idx)} />
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
									onClick={() =>
										setQuestions((prev) =>
											prev.map((x) => {
												if (x.id !== q.id) return x;
												const newOptions = (x.options ?? []).filter((_, i) => i !== idx);
												const nextCorrect = (x.correctIndices ?? []).filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i));
												return { ...x, options: newOptions, correctIndices: nextCorrect };
											})
										)
									}
								>
									<Trash2 size={16} />
								</RemoveOpt>
							</OptionRow>
						))}
					</QuestionCard>
				))}
			</CenterInner>
		</CenterPanel>
	);
}

/* Styled Components for Content */
const CenterPanel = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-l);
  overflow-y: auto;
  overflow-x: hidden;
`;

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
  background-color: var(--quiz-surface-muted);
  padding: var(--spacing);
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
`;

const OptionRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing);
  background-color: var(--quiz-surface);
  border-bottom: 1px solid var(--color-border);
`;

const OptionInput = styled(Input)`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--color-text);
`;

const RemoveOpt = styled.button`
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: transparent;
    color: var(--color-error-bg);
  }
`;
