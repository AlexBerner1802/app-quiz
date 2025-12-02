import React, { useState, useEffect } from "react";
import styled from "styled-components";
import QuizHeader from "./QuizHeader";
import { useTranslation } from "react-i18next";
import Tag from "../../components/ui/Tag";
import Button from "../../components/ui/Button";

export default function QuizViewer({ quiz }) {
	const { t } = useTranslation();
	const [step, setStep] = useState("intro");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answersMap, setAnswersMap] = useState({});
	const [timer, setTimer] = useState(0);

	console.log(quiz)

	// Timer
	useEffect(() => {
		if (step !== "question" && step !== "end") return; // timer runs only in question mode
		const interval = setInterval(() => setTimer(t => t + 1), 1000);

		return () => clearInterval(interval); // not stopping unless step changes
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
			setStep("end");
		}
	};

	const handlePrev = () => {
		if (currentIndex > 0) {
			setCurrentIndex(prev => prev - 1);
		}
	};

	const handleStop = () => {
		setStep("intro");
		setCurrentIndex(0);
		setAnswersMap({});
		setTimer(0);
	};

	// Utility to format seconds -> mm:ss
	const formatTime = (seconds) => {
		const m = Math.floor(seconds / 60).toString().padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	if(!quiz) return null;

	// Current question
	const question = quiz.questions[currentIndex];


	return (
		<Wrapper>
			<QuizHeader title={quiz.title}/>

			<Content>

				{step === "intro" && (
					<IntroCard>
						<Title>{quiz.title}</Title>

						{quiz.cover_image_url && <Cover src={quiz.cover_image_url} alt={quiz.title} />}

						<Description>{quiz.description}</Description>

						{quiz.modules?.length > 0 || quiz.tags?.length > 0 ? (
							<TagsContainer>
								{quiz.modules?.map((m, i) => (
									<Tag key={`module-${i}`} size={"l"}>{m.name}</Tag>
								))}
								{quiz.tags?.map((t, i) => (
									<Tag key={`tag-${i}`} variant="secondary" size={"l"}>{t.name}</Tag>
								))}
							</TagsContainer>
						) : null}

						<Button onClick={handleStart}
								size={"l"}
								style={{ width: "fit-content" }}>
							{t("quiz.start")}
						</Button>
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
									<AnswerBox
										key={ansId}
										onClick={() => handleAnswer(ansId)}
										selected={selected}
									>
										{ans.text}
									</AnswerBox>
								)
							})}
						</AnswersGrid>


						<ButtonsRow>
							{currentIndex > 0 && (
								<PrevButton onClick={handlePrev} variant={"secondary"}>
									{t("quiz.prev")}
								</PrevButton>
							)}

							<ContinueButton
								variant="primary"
								style={{ width: "fit-content" }}
								disabled={!answersMap[currentIndex]}
								onClick={handleNext}
							>
								{currentIndex + 1 < quiz.questions.length ? t("quiz.continue") : t("quiz.finish")}
							</ContinueButton>
						</ButtonsRow>
					</QuestionCard>
				)}

				{step === "end" && (
					<EndCard>
						<p>{t("quiz.endMessage")}</p>
						<Button onClick={handleStop}
								size={"l"}
								style={{ width: "fit-content" }}>
							{t("quiz.stop")}
						</Button>
						<p>Time: {formatTime(timer)}</p>
					</EndCard>
				)}
			</Content>
		</Wrapper>
	);
}


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
	justify-content: space-around;
	margin-top: var(--spacing-l);
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
	width: calc(25% - var(--spacing-s));
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

