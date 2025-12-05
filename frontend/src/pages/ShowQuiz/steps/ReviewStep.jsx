import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";
import {PartyPopper, CircleCheck, CircleX} from "lucide-react";
import {applyScoreMultiplier} from "../../../utils/score";
import {formatTime} from "../../../utils/dateUtils";
import ParticlesBackground from "../../../components/particules/ParticlesBackground";

export default function ReviewStep({ quiz, result, onClose }) {

	console.log(result)

	return (
		<ReviewCard>

			<ParticlesBackground preset="links" />

			<Container>
				<Content>

					<ScoreContainer>
						<ScoreInfo>
							<Title>Your Score</Title>
							<Score>
								{applyScoreMultiplier(result.score)}
								<ScoreTotal> / {applyScoreMultiplier(result.best_possible_score)}</ScoreTotal>
							</Score>
							<TimeTaken>Time taken: {formatTime(result.time_taken)}</TimeTaken>
						</ScoreInfo>
						<AnimatedPartyPopper  size={100} color={"var(--color-primary-bg"} />
					</ScoreContainer>

					{result.answers.map((a, i) => (
						<QuestionCard key={i}>
							<Question>{i + 1}. {a.question}</Question>
							<AnswersGrid>
								{a.answers.map(ans => {
									const isUserSelected = a.user_answer_ids.includes(ans.id);
									const isCorrect = ans.is_correct === true; // only exists for selected answers
									return (
										<AnswerBox
											key={ans.id}
											correct={isCorrect}
											selected={isUserSelected && !isCorrect}
											style={{
												borderColor: isCorrect ? "green" : isUserSelected ? "red" : undefined,
												backgroundColor: isCorrect ? "#e6ffed" : isUserSelected ? "#ffe6e6" : undefined
											}}
										>
											<p>{ans.translation ?? "[No text]"}{" "}</p>
											{isCorrect && <CircleCheck size={20} color="green" style={{ verticalAlign: "middle" }} />}
											{isUserSelected && !isCorrect && <CircleX size={20} color="red" style={{ verticalAlign: "middle" }} />}
										</AnswerBox>
									);
								})}
							</AnswersGrid>
							<ScoreQuestion>Score for this question: {applyScoreMultiplier(a.score)}</ScoreQuestion>
						</QuestionCard>
					))}

					<Button onClick={onClose} size="l">Close</Button>
				</Content>
			</Container>
		</ReviewCard>
	);
}


const ReviewCard = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const Container = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: var(--spacing-xl);
    align-items: flex-start;
    overflow-y: auto;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
	max-width: 1000px;
	padding: var(--spacing-l) 0;
	margin: 0 auto;
`;

const ScoreContainer = styled.div`
    display: flex;
	align-items: center;
    width: 100%;
    padding: var(--spacing-xl);
    color: var(--color-text);
    border-radius: var(--border-radius);
    border: 2px solid var(--color-primary-bg);
    background-color: var(--color-primary-muted);
	box-shadow: var(--box-shadow-l);
	margin-top: var(--spacing-2xl);
	margin-bottom: var(--spacing-4xl);
    animation: flashReveal 2s ease-out forwards;

    @keyframes flashReveal {
        0% {opacity: 0;}
        20% {opacity: 0.8;}
        35% {opacity: 0.4;}
        50% {opacity: 0.8;}
        60% {opacity: 0.5;}
        70% {opacity: 0.9;}
        78% {opacity: 0.6;}
        86% {opacity: 0.9;}
        92% {opacity: 0.7;}
        100% {opacity: 1;}
    }
`;

const ScoreInfo = styled.div`
    display: flex;
	flex-direction: column;
	gap: var(--spacing-2xs);
    width: 100%;
	flex: 1;
`;

const Title = styled.h2`
    font-size: var(--font-size-2xl);
    font-weight: 600;
`;

const Score = styled.p`
    font-family: "Orbitron", sans-serif;
	color: var(--color-primary-bg);
    font-size: var(--font-size-9xl);
	font-weight: 600;
`;

const ScoreTotal = styled.span`
    font-family: "Orbitron", sans-serif;
	color: var(--color-text);
    font-size: var(--font-size-5xl);
	font-weight: 600;
`;

const TimeTaken = styled.p`
	margin-top: var(--spacing-xs);
	color: var(--color-text-muted);
    font-size: var(--font-size);
    font-weight: 500;
`;

const AnimatedPartyPopper = styled(PartyPopper)`
	margin-right: var(--spacing-xl);
  animation: popperBounce 1.5s ease-in-out infinite;

  @keyframes popperBounce {
    0%   { transform: rotate(0deg) translateY(0); }
    25%  { transform: rotate(-15deg) translateY(-5px); }
    50%  { transform: rotate(15deg) translateY(0); }
    75%  { transform: rotate(-10deg) translateY(-3px); }
    100% { transform: rotate(0deg) translateY(0); }
  }
`;

const QuestionCard = styled.div`
	display:grid; 
	gap:var(--spacing);
	margin-bottom: var(--spacing-2xl);
`;

const Question = styled.p`
	font-size: var(--font-size-l); 
	font-weight:500; 
	color: var(--color-text);
`;

const AnswersGrid = styled.div`
	display:flex; 
	flex-direction: column;
    border-radius: var(--border-radius-xs);
	gap: var(--spacing-2xs);
`;

const AnswerBox = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--spacing-s);
    border-radius: var(--border-radius-xs);
    font-size: var(--font-size-l);
	line-height: 20px;
    font-weight: 500;
    padding: var(--spacing);
    border: 2px solid var(--color-border);
    background-color: var(--color-background-surface-2);
    color: var(--color-text);
    transition: all 0.2s;
    width: 100%;
    box-sizing: border-box;
    flex: 1;

    p {
		width: 100%;
		flex: 1;
    }
        ${({ correct, selected }) =>
                correct
                        ? `color: var(--color-success-text);`
                        : selected
                                ? `color: var(--color-error-text);`
                                : `color: var(--color-text);`}
`;

const ScoreQuestion = styled.p`
	text-align: right;
	font-size: var(--font-size);
	font-weight: 500;
	color: var(--color-text-muted);
	margin-top: calc(-1 * var(--spacing-xs));
`;
