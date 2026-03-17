import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";
import {PartyPopper, CircleCheck, CircleX} from "lucide-react";
import {normalizeScore } from "../../../utils/score";
import {formatTime} from "../../../utils/dateUtils";
import Invader from "../../../components/icons/Invader";
import {useTranslation} from "react-i18next";

export default function ReviewStep({ quiz, result, onClose }) {

	const {t} = useTranslation();

	return (
		<ReviewCard>

			<Container>

				<InvaderIconWrapper>
					<Invader size={1200} color="var(--color-text)" />
				</InvaderIconWrapper>

				<Content>
					<ResultsContent>
						<ScoreContainer>
							<ScoreInfo>
								<Title>{t("quiz.yourScore")}</Title>
								<Score>
									{normalizeScore({
										rawScore: result.score,
										quizMaxScore: result.best_possible_score,
									})}
									<ScoreTotal>
										{" / "}
										{normalizeScore({
											rawScore: result.best_possible_score,
											quizMaxScore: result.best_possible_score,
										})}
									</ScoreTotal>
								</Score>
								<TimeTaken>{t("common.timeTaken")} : {formatTime(result.time_taken)}</TimeTaken>
							</ScoreInfo>
							<AnimatedPartyPopper  size={100} color={"var(--color-primary-bg"} />
						</ScoreContainer>

						{result.answers.map((a, i) => {
							const maxScoreForQuestion = a.answers.filter(ans => ans.is_correct).length;

							return (
								<QuestionCard key={i}>
									<Question>{i + 1}. {a.question}</Question>
									<AnswersGrid>
										{a.answers.map(ans => {
											const isUserSelected = a.user_answer_ids.includes(ans.id);
											const isCorrect = ans.is_correct === true; // only exists for selected answers
											return (
												<AnswerBox
													key={ans.id}
													$correct={isCorrect}
													selected={isUserSelected && !isCorrect}
													style={{
														color: isCorrect ? "var(--color-success-muted-text)" : isUserSelected ? "var(--color-error-muted-text)" : "var(--color-text)",
														backgroundColor: isCorrect ? "var(--color-success-muted)" : isUserSelected ? "var(--color-error-muted)" : undefined,
														borderColor: isCorrect ? "var(--color-success-muted-text)" : isUserSelected ? "var(--color-error-muted-text)" : undefined
													}}
												>
													<p>{ans.translation ?? "[No text]"}{" "}</p>
													{isCorrect &&
														<CircleCheck size={20} color="var(--color-success-muted-text)"
																	 style={{verticalAlign: "middle"}}/>}
													{isUserSelected && !isCorrect &&
														<CircleX size={20} color="var(--color-error-muted-text)"
																 style={{verticalAlign: "middle"}}/>}
												</AnswerBox>
											);
										})}
									</AnswersGrid>
									<ScoreQuestion>
										{t("quiz.scoreForQuestion", {
											score: normalizeScore({
													rawScore: a.score,
													quizMaxScore: result.best_possible_score,
												}),
											total:  normalizeScore({
													rawScore: 1,
													quizMaxScore: result.best_possible_score,
												}),
											}
										)}
									</ScoreQuestion>
								</QuestionCard>
							)
						})}

						<Button onClick={onClose} size="l">{t("common.close")}</Button>
					</ResultsContent>
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
    align-items: flex-start;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
	margin: 0 auto;
    overflow-y: auto;
    padding: var(--spacing-xl);    
	z-index: 1;
`;

const ResultsContent = styled.div`
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
	margin-top: var(--spacing-xl);
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
	gap: var(--spacing-xs);
`;

const AnswerBox = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-s);
    border-radius: var(--border-radius-xs);
    font-size: var(--font-size);
    line-height: 20px;
    font-weight: 500;
    padding: var(--spacing);
    border: 2px solid var(--color-border-subtle);
    width: 100%;
    box-sizing: border-box;
    flex: 1;
    transition: all 0.2s;

    p {
        width: 100%;
        flex: 1;
    }

    /* Background and color logic with gradient */
    ${({ $correct, selected }) => {
        if ($correct) {
            return `
                background: linear-gradient(
                    to bottom,
                    rgba(var(--color-success-rgb), 0.2),  /* top fade */
                    var(--color-success-muted),            /* middle solid */
                    rgba(var(--color-success-rgb), 0.2)   /* bottom fade */
                );
                color: var(--color-success-text);
                border-color: var(--color-success-muted-text);
            `;
        } else if (selected) {
            return `
                background: linear-gradient(
                    to bottom,
                    rgba(var(--color-error-rgb), 0.2),   /* top fade */
                    var(--color-error-muted),             /* middle solid */
                    rgba(var(--color-error-rgb), 0.2)    /* bottom fade */
                );
                color: var(--color-error-text);
                border-color: var(--color-error-muted-text);
            `;
        } else {
            return `
                /* Diagonal stripes for unselected / incorrect */
                background-image: repeating-linear-gradient(
                    -126deg,
                    var(--color-background-surface-1),
                    var(--color-background-surface-1) 5px,
                    rgba(0,0,0,0) 5px,
                    rgba(0,0,0,0) 10px
                );
                border: none;
                box-shadow: var(--box-shadow-xs);
                color: var(--color-text);
            `;
        }
    }}
`;

const ScoreQuestion = styled.p`
	text-align: right;
	font-size: var(--font-size);
	font-weight: 500;
	color: var(--color-text-muted);
	margin-top: calc(-1 * var(--spacing-xs));
`;

const InvaderIconWrapper = styled.div`
    position: absolute;
    bottom: -360px;
    right: -200px;
    transform: rotate(-30deg);
    z-index: 0;
    pointer-events: none;
    opacity: 0.1;
`;