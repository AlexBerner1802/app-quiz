import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";
import { formatTime } from "../../../utils/dateUtils";
import { Clock } from "lucide-react";


export default function QuestionStep({
										 quiz,
										 currentIndex,
										 answersMap,
										 onAnswer,
										 onNext,
										 onPrev,
										 timer
									 }) {
	const question = quiz.questions[currentIndex];

	return (
		<QuestionCard>

			<QuestionCardHeader>
				<Clock size={40} color={"var(--color-text)"} />
				<TimerDisplay>
					<TimerLabel>Time remaining</TimerLabel>
					<TimerDisplay>{formatTime(timer)}</TimerDisplay>
				</TimerDisplay>
			</QuestionCardHeader>

			<QuestionContent>
				<QuestionContentLeft>
					<SubTitle>Question {currentIndex + 1} of {quiz.questions.length}</SubTitle>
					<Question>{question.title}</Question>
					{question.description && <QuestionDescription>{question.description}</QuestionDescription>}

					<AnswersGrid>
						{question.answers.map(ans => {
							const ansId = ans.id ?? ans.text;
							const selected = answersMap[currentIndex]?.includes(ansId);
							return (
								<AnswerBox key={ansId} selected={selected} onClick={() => onAnswer(ansId)}>
									{ans.text}
								</AnswerBox>
							);
						})}
					</AnswersGrid>
				</QuestionContentLeft>

				<QuestionContentRight>
					<CircleProgressWrapper>
						<svg viewBox="0 0 36 36">
							<circle
								cx="18"
								cy="18"
								r="16"
								stroke="var(--color-border)"
								strokeWidth="2"
								fill="none"
							/>
							<circle
								cx="18"
								cy="18"
								r="16"
								stroke="var(--color-primary-bg)"
								strokeWidth="3"
								fill="none"
								strokeDasharray="100"
								strokeDashoffset={100 - ((currentIndex + 1) / quiz.questions.length) * 100}
								strokeLinecap="round"
								transform="rotate(-90 18 18)"
								style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
							/>
						</svg>
						<CircleLabel>
							{quiz.questions.length - currentIndex } / {quiz.questions.length}
						</CircleLabel>
					</CircleProgressWrapper>
				</QuestionContentRight>
			</QuestionContent>


			<ButtonsRow>
				{currentIndex > 0 && <PrevButton onClick={onPrev} variant="secondary">Prev</PrevButton>}
				<ContinueButton
					variant="primary"
					disabled={!answersMap[currentIndex]?.length}
					onClick={onNext}
				>
					{currentIndex + 1 < quiz.questions.length ? "Next" : "Finish"}
				</ContinueButton>
			</ButtonsRow>
		</QuestionCard>
	);
}


const QuestionCard = styled.div`
	display: flex; 
	flex-direction: column;
	gap: var(--spacing-s);
	padding: var(--spacing-2xl);
	border-radius: var(--border-radius-xl);
	box-shadow: var(--box-shadow-xl);
	background: var(--color-background-surface-3);
	width: 100%;
`;

const QuestionCardHeader = styled.div`
	display: flex; 
	width: 100%;
	margin-bottom: var(--spacing-2xl);
	gap: var(--spacing-s);
	align-items: center;
`;

const QuestionContent = styled.div`
	display: flex; 
	width: 100%;
	gap: var(--spacing-s);
	align-items: flex-start;
`;

const QuestionContentLeft = styled.div`
	display: flex; 
	flex-direction: column;
	gap: var(--spacing-s);
	flex: 1;
	width: 100%;
`;

const QuestionContentRight = styled.div`
	display: flex; 
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 40%;
`;

const TimerDisplay = styled.div`
	display: flex;
	flex-direction: column;
	font-size: var(--font-size-2xl); 
	font-weight: 600;
	color: var(--color-text); 
	gap: var(--spacing-xs);
`;

const TimerLabel = styled.p`
	font-size: var(--font-size-s); 
	color: var(--color-text-muted); 
`;

const SubTitle = styled.p`
	font-size: var(--font-size-l); 
	font-weight: 600; 
	color: var(--color-text-muted);
`;

const Question = styled.p`
	font-size: var(--font-size-2xl); 
	line-height: 1.9rem;
	font-weight: 500; 
	color: var(--color-text);
`;

const QuestionDescription = styled.p`
	font-size: var(--font-size-l); 
	color: var(--color-text-muted);
`;

const AnswersGrid = styled.div`
	display: flex; 
	flex-wrap: wrap; 
	margin-top: var(--spacing-l); 
	gap: var(--spacing-s);
`;

const AnswerBox = styled.div`
	border-radius: var(--border-radius-xs);
	font-size: var(--font-size-l);
	font-weight: 500;
	padding: var(--spacing);
	cursor: pointer;
	border: ${({ selected }) => selected ? "2px solid var(--color-primary-bg)" : "2px solid var(--color-border)"};
	background-color: ${({ selected }) => selected ? "var(--color-primary-muted)" : "var(--color-background-surface-2)"};
	color: ${({ selected }) => selected ? "var(--color-primary-bg)" : "var(--color-text)"};
	transition: all 0.2s;
	min-width: var(--spacing-7xl);
	min-height: var(--spacing-5xl);
	flex: 0 0 calc(50% - var(--spacing-s));
	box-sizing: border-box;
`;

const ButtonsRow = styled.div`
	display: flex; 
	justify-content: flex-end; 
	gap: var(--spacing-s);
	margin-top: var(--spacing-2xl);
`;

const PrevButton = styled(Button)``;

const ContinueButton = styled(Button)``;

const CircleProgressWrapper = styled.div`
	position: relative;
	width: 300px;
	height: 300px;
	display: flex;
	justify-content: center;
	align-items: center;
`;

const CircleLabel = styled.div`
	position: absolute;
	font-size: var(--font-size-6xl);
	font-weight: 700;
	text-align: center;
	color: var(--color-text);
	line-height: 1.2;
`;
