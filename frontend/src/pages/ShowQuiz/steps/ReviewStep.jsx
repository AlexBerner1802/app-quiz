import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";

export default function ReviewStep({ quiz, result, onClose }) {
	return (
		<EndCard>
			<h3>Quiz Review</h3>
			<p>Score: {result.score.toFixed(2)}</p>
			<p>Time Taken: {result.time_taken}s</p>

			{result.answers.map((a, i) => (
				<QuestionCard key={i}>
					<Question>{i + 1}. {a.question}</Question>
					<AnswersGrid>
						{quiz.questions[i].answers.map(ans => {
							const isUserSelected = a.user_answer_ids.includes(ans.id);
							const isCorrect = a.correct_answer_ids.includes(ans.id);
							return (
								<AnswerBox
									key={ans.id}
									selected={isUserSelected}
									style={{
										borderColor: isCorrect ? "green" : isUserSelected ? "red" : undefined,
										backgroundColor: isCorrect ? "#e6ffed" : isUserSelected ? "#ffe6e6" : undefined
									}}
								>
									{ans.text}
									{isCorrect && " ✅"}
									{isUserSelected && !isCorrect && " ❌"}
								</AnswerBox>
							);
						})}
					</AnswersGrid>
					<p>Score for this question: {a.score.toFixed(2)}</p>
				</QuestionCard>
			))}

			<Button onClick={onClose} size="l">Close</Button>
		</EndCard>
	);
}

const EndCard = styled.div`
	display:flex; 
	flex-direction:column; 
	justify-content:center; 
	align-items:center; 
	gap: var(--spacing); 
	text-align:center;
`;

const QuestionCard = styled.div`
	display:grid; 
	gap:var(--spacing);
`;

const Question = styled.p`
	font-size: var(--font-size-xl); 
	font-weight:500; 
	color: var(--color-text);
`;

const AnswersGrid = styled.div`
	display:flex; 
	flex-wrap:wrap; 
	margin-top:var(--spacing-l); 
	gap:var(--spacing-s);
`;

const AnswerBox = styled.div`
	border-radius: var(--border-radius-xs);
	font-size: var(--font-size-l);
	padding: var(--spacing);
	border: 1px solid;
	box-sizing: border-box;
	min-width: var(--spacing-7xl);
	min-height: var(--spacing-5xl);
`;
