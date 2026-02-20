import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import QuizHeader from "./QuizHeader";
import { useTranslation } from "react-i18next";
import IntroStep from "./steps/IntroStep";
import QuestionStep from "./steps/QuestionStep";
import ConfirmEndStep from "./steps/ConfirmEndStep";
import ReviewStep from "./steps/ReviewStep";
import useBlockNavigation from "../../hooks/useBlockNavigation";
import {finishQuizAttempt, startQuizAttempt} from "../../services/api";
import { useAuth } from "../../context/auth";
import { AlarmClock, Loader2 } from "lucide-react";
import {formatTime} from "../../utils/dateUtils";
import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";
import ConfirmEndModal from "../../components/modals/ConfirmEndModal";

export default function QuizViewer({ quiz }) {
	const { user } = useAuth();
	const { t, i18n } = useTranslation();
	const startedRef = useRef(false);

	const [attemptId, setAttemptId] = useState(null);
	const [step, setStep] = useState("starting");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answersMap, setAnswersMap] = useState({});
	const [timer, setTimer] = useState(0);
	const [saving, setSaving] = useState(false);
	const [savedResult, setSavedResult] = useState(null);
	const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);

	const lang = i18n.language.split('-')[0];

	useEffect(() => {
		if (!quiz?.id_quiz) return;
		if (!user?.localAccountId) return;
		if (startedRef.current) return;
		startedRef.current = true;
		
		(async () => {
			try {
				const startResult = await startQuizAttempt(quiz.id_quiz, lang, user.localAccountId);
				setAttemptId(startResult.attempt_id);
				setStep("question");
			} catch (e) {
				startedRef.current = false;
				alert(t("quiz.startError"));
				}
			})();
	}, [quiz?.id_quiz, user?.localAccountId, lang, t]);

	useBlockNavigation(step === "question", t("quiz.leaveWarning"));

	// Timer
	useEffect(() => {
		if (step !== "question") return;
		if (showConfirmEndModal) return;

		const interval = setInterval(() => {
			setTimer(t => t + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, [step, showConfirmEndModal]);

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
			setShowConfirmEndModal(true);
		}
	};

	const handlePrev = () => {
		if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
	};


	const handleFinishQuiz = async () => {
		if (saving) return;
		setSaving(true);

		console.log("the quiz", quiz);

		const payload = quiz.questions.map((q, index) => ({
			id_question: q.id,
			answer_ids: answersMap[index] || [],
			answer_text: String(answersMap[index]?.[0] ?? ""),
		}));

		try {
			const result = await finishQuizAttempt(quiz.id_quiz, attemptId, {
				ended_at: new Date().toISOString(),
				time_taken: timer,
				lang,
				answers: payload
			});

			setSavedResult(result);
			setStep("review");
		} catch (err) {
			alert(t("quiz.saveError"));
		} finally {
			setSaving(false);
		}
	};


	if (!quiz) return null;

	return (
		<Wrapper>
			<QuizHeader title={quiz.title} onBack={() => {
				if (step === "question") return window.confirm(t("quiz.leaveWarning"));
				return true;
			}}>
				<ToggleThemeSwitch />
				<TimerDisplay>
					<TimerLabel>{t("common.timeElapsed")}</TimerLabel>
					<TimerDisplay>{formatTime(timer)}</TimerDisplay>
				</TimerDisplay>
				<CustomAlarmClock
					size={38}
					color={"var(--color-text-muted)"}
					$active={step === "question"}
				/>
			</QuizHeader>

			<Content>
				{step === "starting" && (
					<Starting>
						<Loader2 className="spin" size={32} strokeWidth={2.5} />
						<p>{t("common.loading")}</p>
					</Starting>
				)}

				{step === "question" && (
					<QuestionStep
						quiz={quiz}
						currentIndex={currentIndex}
						answersMap={answersMap}
						onAnswer={handleAnswer}
						onNext={handleNext}
						onPrev={handlePrev}
						onJump={(i) => setCurrentIndex(i)}
						timer={timer}
					/>
				)}

				{showConfirmEndModal && (
					<ConfirmEndModal
						saving={saving}
						onCancel={() => setShowConfirmEndModal(false)}
						onClose={() => setShowConfirmEndModal(false)}
						onConfirm={async () => {
						await handleFinishQuiz();

						setShowConfirmEndModal(false);
						}}
					/>
					)}

				{step === "review" && savedResult && (
					<ReviewStep
						quiz={quiz}
						result={savedResult}
						onClose={() => {
							window.location.href = "/home";
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
    overflow: hidden;
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

const CustomAlarmClock = styled(AlarmClock)`
    animation: ${({ $active }) => $active ? "wiggle 1.2s ease-in-out infinite" : "none"};

    @keyframes wiggle {
        0%   { transform: rotate(20deg); }
        50%  { transform: rotate(-20deg); }
        100% { transform: rotate(20deg); }
    }
`;

const TimerLabel = styled.p`
	font-size: var(--font-size-s); 
	color: var(--color-text-muted); 
`;

const Starting = styled.div`
	width: 100%;
	height: 100%;
	display: grid;
	place-content: center;
	gap: var(--spacing);
	color: var(--color-text);

	.spin {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		100% { transform: rotate(360deg); }
	}
`;
