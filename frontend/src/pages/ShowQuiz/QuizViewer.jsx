import React, { useState, useEffect } from "react";
import styled from "styled-components";
import QuizHeader from "./QuizHeader";
import { useTranslation } from "react-i18next";
import IntroStep from "./steps/IntroStep";
import QuestionStep from "./steps/QuestionStep";
import ConfirmEndStep from "./steps/ConfirmEndStep";
import ReviewStep from "./steps/ReviewStep";
import useBlockNavigation from "../../hooks/useBlockNavigation";
import { submitQuizAttempt } from "../../services/api";
import { useAuth } from "../../context/auth";
import { AlarmClock } from "lucide-react";
import {formatTime} from "../../utils/dateUtils";

export default function QuizViewer({ quiz }) {
	const { user } = useAuth();
	const { t, i18n } = useTranslation();

	const [step, setStep] = useState("intro");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answersMap, setAnswersMap] = useState({});
	const [timer, setTimer] = useState(0);
	const [saving, setSaving] = useState(false);
	const [savedResult, setSavedResult] = useState(null);

	useBlockNavigation(step === "question", t("quiz.leave_warning"));

	// Timer
	useEffect(() => {
		if (step !== "question") return;
		const interval = setInterval(() => setTimer(t => t + 1), 1000);
		return () => clearInterval(interval);
	}, [step]);

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
			setCurrentIndex(prev => prev + 1);
		} else {
			setStep("confirmEnd");
		}
	};

	const handlePrev = () => {
		if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
	};

	const handleFinishQuiz = async () => {
		if (saving) return;
		setSaving(true);

		const payload = quiz.questions.map((q, index) => ({
			id_question: q.id,
			answer_ids: answersMap[index] || [],
			answer_text: String(answersMap[index]?.[0] ?? ""),
		}));

		const lang = i18n.language.split('-')[0];

		try {
			const result = await submitQuizAttempt(quiz.id_quiz, {
				started_at: new Date(Date.now() - timer * 1000).toISOString(),
				ended_at: new Date().toISOString(),
				time_taken: timer,
				lang: lang,
				id_owner: user.localAccountId,
				answers: payload
			});
			setSavedResult(result);
			setStep("review");
		} catch (err) {
			alert(t("quiz.save_error"));
		} finally {
			setSaving(false);
		}
	};


	if (!quiz) return null;

	return (
		<Wrapper>
			<QuizHeader title={quiz.title} onBack={() => {
				if (step === "question") return window.confirm(t("quiz.leave_warning"));
				return true;
			}}>
				<TimerDisplay>
					<TimerLabel>Time remaining</TimerLabel>
					<TimerDisplay>{formatTime(timer)}</TimerDisplay>
				</TimerDisplay>
				<AlarmClock size={38} color={"var(--color-text-muted)"} />
			</QuizHeader>

			<Content>
				{step === "intro" && (
					<IntroStep
						quiz={quiz}
						onStart={() => setStep("question")}
					/>
				)}

				{step === "question" && (
					<QuestionStep
						quiz={quiz}
						currentIndex={currentIndex}
						answersMap={answersMap}
						onAnswer={handleAnswer}
						onNext={handleNext}
						onPrev={handlePrev}
						onJump={(i) => setCurrentIndex(i)}   // ← Add this
						timer={timer}
					/>
				)}

				{step === "confirmEnd" && (
					<ConfirmEndStep
						onCancel={() => setStep("question")}
						onConfirm={handleFinishQuiz}
						saving={saving}
					/>
				)}

				{step === "review" && savedResult && (
					<ReviewStep
						quiz={quiz}
						result={savedResult}
						onClose={() => {
							setStep("intro");
							setCurrentIndex(0);
							setAnswersMap({});
							setTimer(0);
							setSavedResult(null);
						}}
					/>
				)}
			</Content>
		</Wrapper>
	);
}


const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
`;

const Content = styled.div`
	display: flex;
	flex: 1;
	width: 100%;
`;

const TimerDisplay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	font-size: var(--font-size-2xl); 
	font-weight: 600;
	color: var(--color-text); 
	gap: var(--spacing-xs);
`;

const TimerLabel = styled.p`
	font-size: var(--font-size-s); 
	color: var(--color-text-muted); 
`;