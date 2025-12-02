import React, { useState, useEffect } from "react";
import styled from "styled-components";
import QuizHeader from "./QuizHeader";
import { useTranslation } from "react-i18next";
import Tag from "../../components/ui/Tag";
import Button from "../../components/ui/Button";
import useBlockNavigation from "../../hooks/useBlockNavigation";
import {submitQuizAttempt} from "../../services/api";
import {useAuth} from "../../context/auth";

export default function QuizViewer({ quiz }) {
	const { user } = useAuth();
	const { t, i18n } = useTranslation();
	const [step, setStep] = useState("intro");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answersMap, setAnswersMap] = useState({});
	const [timer, setTimer] = useState(0);
	const [saving, setSaving] = useState(false);
	const [savedResult, setSavedResult] = useState(null);

	const API_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8000";

	useBlockNavigation(step === "question", t("quiz.leave_warning"));

	// Timer
	useEffect(() => {
		if (step !== "question") return;
		const interval = setInterval(() => setTimer(t => t + 1), 1000);
		return () => clearInterval(interval);
	}, [step]);

	const handleStart = () => setStep("question");

	const handleAnswer = (answerId) => {
		setAnswersMap(prev => {
			const prevSet = new Set(prev[currentIndex] || []);
			if (prevSet.has(answerId)) prevSet.delete(answerId);
			else prevSet.add(answerId);
			return { ...prev, [currentIndex]: Array.from(prevSet) };
		});
	};

	const handleNext = () => {
		if (currentIndex + 1 < quiz.questions.length) {
			setCurrentIndex(currentIndex + 1);
		} else {
			handleFinishQuiz();
		}
	};

	const handlePrev = () => {
		if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
	};

	const handleStop = () => {
		if (step === "question" && !window.confirm(t("quiz.leaveWarning"))) return;
		setStep("intro");
		setCurrentIndex(0);
		setAnswersMap({});
		setTimer(0);
	};

	const handleConfirmEnd = () => setStep("confirmEnd");

	const handleFinishQuiz = async () => {
		if (saving) return;
		setSaving(true);

		const payload = quiz.questions.map((q, index) => ({
			id_question: q.id,
			answer_ids: answersMap[index] || [],
			answer_text: String(answersMap[index]?.[0] ?? ""),
		}));

		try {
			const result = await submitQuizAttempt(quiz.id_quiz, {
				started_at: new Date(Date.now() - timer * 1000).toISOString(),
				ended_at: new Date().toISOString(),
				time_taken: timer,
				lang: i18n.language,
				azure_id: user.localAccountId,
				answers: payload
			});
			console.log(result)
			setSavedResult(result);
			setStep("review");
		} catch (err) {
			alert(t("quiz.save_error"));
		} finally {
			setSaving(false);
		}
	};

	const formatTime = (seconds) => {
		const m = Math.floor(seconds / 60).toString().padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	if (!quiz) return null;

	const question = quiz.questions[currentIndex];

	return (
		<Wrapper>
			<QuizHeader title={quiz.title}
						onBack={() => {
							if (step === "question") {
								return window.confirm(t("quiz.leave_warning"));
							}
							return true;
						}}/>
			<Content>
				{step === "intro" && (
					<IntroCard>
						<Title>{quiz.title}</Title>
						{quiz.cover_image_url && <Cover src={API_URL + quiz.cover_image_url} alt={quiz.title} />}
						<Description>{quiz.description}</Description>
						{(quiz.modules?.length || quiz.tags?.length) > 0 && (
							<TagsContainer>
								{quiz.modules?.map((m, i) => <Tag key={i} size="l">{m.name}</Tag>)}
								{quiz.tags?.map((t, i) => <Tag key={i} variant="secondary" size="l">{t.name}</Tag>)}
							</TagsContainer>
						)}
						<Button onClick={handleStart} size="l">{t("quiz.start")}</Button>
					</IntroCard>
				)}

				{step === "question" && question && (
					<QuestionCard>
						<TimerDisplay>{t("quiz.timer")}: {formatTime(timer)}</TimerDisplay>
						<Question>{currentIndex + 1}. {question.title}</Question>
						{question.description && <QuestionDescription>{question.description}</QuestionDescription>}

						<AnswersGrid>
							{question.answers.map(ans => {
								const ansId = ans.id ?? ans.text;
								const selected = answersMap[currentIndex]?.includes(ansId);
								return (
									<AnswerBox key={ansId} selected={selected} onClick={() => handleAnswer(ansId)}>
										{ans.text}
									</AnswerBox>
								);
							})}
						</AnswersGrid>

						<ButtonsRow>
							{currentIndex > 0 && <PrevButton onClick={handlePrev} variant="secondary">{t("quiz.prev")}</PrevButton>}
							<ContinueButton
								variant="primary"
								disabled={!answersMap[currentIndex]}
								onClick={currentIndex + 1 < quiz.questions.length ? handleNext : handleConfirmEnd}
							>
								{currentIndex + 1 < quiz.questions.length ? t("quiz.continue") : t("quiz.finish")}
							</ContinueButton>
						</ButtonsRow>
					</QuestionCard>
				)}

				{step === "confirmEnd" && (
					<EndCard>
						<p>{t("quiz.confirmEndMessage")}</p>
						<ButtonsRow>
							<Button onClick={() => setStep("question")} variant="secondary">
								{t("quiz.cancel")}
							</Button>
							<Button onClick={handleFinishQuiz} variant="primary" disabled={saving}>
								{saving ? t("quiz.saving") : t("quiz.finish")}
							</Button>
						</ButtonsRow>
					</EndCard>
				)}

				{step === "review" && savedResult && (
					<EndCard>
						<h3>{t("quiz.reviewTitle")}</h3>
						<p>{t("quiz.score")}: {savedResult.score.toFixed(2)}</p>
						<p>{t("quiz.timeTaken")}: {formatTime(savedResult.time_taken)}</p>

						{savedResult.answers.map((a, i) => (
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
										)
									})}
								</AnswersGrid>
								<p>Score for this question: {a.score.toFixed(2)}</p>
							</QuestionCard>
						))}

						<Button onClick={handleStop} size="l">{t("quiz.close")}</Button>
					</EndCard>
				)}
			</Content>
		</Wrapper>
	);
}

// Styled components same as your previous code



const Wrapper = styled.div`
    gap: var(--spacing-l);
`;

const Content = styled.div`
    padding: var(--spacing-2xl);
	max-width: var(--spacing-14xl);
	margin: 0 auto;
`;

const IntroCard = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: var(--spacing);
	text-align: center;
`;

const Title = styled.p`
	font-size: var(--font-size-3xl);
	font-weight: 600;
`;

const Cover = styled.img`
	width: 100%;
	height: 30vh;
	max-height: var(--spacing-8xl);
	object-fit: cover;
	border-radius: var(--border-radius-s);
	border: 1px solid var(--color-border);
`;

const Description = styled.p`
	font-size: var(--font-size-l);
	line-height: var(--line-height-xl);
	padding: 0 var(--spacing);
`;

const TagsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    justify-content: center;
    margin-bottom: var(--spacing-xl);
`;

const QuestionCard = styled.div`
  display: grid;
  gap: var(--spacing);
`;

const Question = styled.p`
	font-size: var(--font-size-xl);
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
    padding: var(--spacing);
    cursor: pointer;
    border: ${({ selected }) => selected ? "1px solid var(--color-primary-bg)" : "1px solid var(--color-border)"};
    background-color: ${({ selected }) => selected ? "var(--color-primary-muted)" : "var(--color-background-surface-2)"};
    color: ${({ selected }) => selected ? "var(--color-primary-bg)" : "var(--color-text)"};
    transition: all 0.2s;
    min-width: var(--spacing-7xl);
    min-height: var(--spacing-5xl);

    flex: 0 0 calc(25% - var(--spacing-s)); /* fixed width for 4 per row */
    box-sizing: border-box;
`;

const ButtonsRow = styled.div`
    display: flex;
    justify-content: flex-end;
	gap: var(--spacing-s);
`;

const PrevButton = styled(Button)`
`;

const ContinueButton = styled(Button)`
`;

const EndCard = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: var(--spacing);
	text-align: center;
`;

const TimerDisplay = styled.div`
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
  text-align: right;
`;

