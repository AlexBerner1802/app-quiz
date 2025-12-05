import React, { useState } from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";
import { PanelLeft } from "lucide-react";
import {useTranslation} from "react-i18next";


export default function QuestionStep({
										 quiz,
										 currentIndex,
										 answersMap,
										 onAnswer,
										 onNext,
										 onPrev,
										 onJump
									 }) {

	const { t } = useTranslation();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const question = quiz.questions[currentIndex];

	const lastAnsweredIndex = Math.max(
		-1,
		...quiz.questions.map((_, i) => (answersMap[i]?.length > 0 ? i : -1))
	);

	return (
		<Wrapper>

			<Sidebar $open={sidebarOpen}>
				<SidebarHeader>
					<h3>{t("common.questions")}</h3>
				</SidebarHeader>

				<SidebarList>
					{quiz.questions.map((q, i) => {
						const answered = answersMap[i]?.length > 0;

						return (
							<SidebarStepItem key={i} $active={i === currentIndex} onClick={() => onJump(i)}>
								<StepIcon $active={i === currentIndex} $answered={answered}>
									{answered ? "✓" : ""}
								</StepIcon>

								<StepLabel onClick={() => onJump(i)}>
									{t("common.question")} {i + 1}
								</StepLabel>

								{/* Only color the line if the next circle is checked */}
								{i < quiz.questions.length - 1 && (
									<StepLine $completed={i < lastAnsweredIndex} />
								)}
							</SidebarStepItem>
						);
					})}
				</SidebarList>

			</Sidebar>

			<QuestionCard>

				<SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)} variant={"ghost"}>
					<PanelLeft size={26} />
				</SidebarToggle>

				<QuestionContent>
					<QuestionItem>
						<SubTitle>{t("common.question")} {currentIndex + 1} of {quiz.questions.length}</SubTitle>

						<Question>{question.title}</Question>
						{question.description && <QuestionDescription>{question.description}</QuestionDescription>}

						<AnswersGrid>
							{question.answers.map(ans => {
								const ansId = ans.id ?? ans.text;
								const selected = answersMap[currentIndex]?.includes(ansId);
								return (
									<AnswerBox
										key={ansId}
										selected={selected}
										onClick={() => onAnswer(ansId)}
									>
										{ans.text}
									</AnswerBox>
								);
							})}
						</AnswersGrid>
					</QuestionItem>
				</QuestionContent>

				<FixedBottomRow>
					<PrevButton onClick={onPrev}
								variant="secondary"
								disabled={currentIndex === 0}>
						{t("common.previous")}
					</PrevButton>

					<ProgressContainer>
						<ProgressBarWrapper>
							<ProgressBar progress={((currentIndex + 1) / quiz.questions.length) * 100} />
						</ProgressBarWrapper>
						<ProgressCount>
							{currentIndex + 1} / {quiz.questions.length}
						</ProgressCount>
					</ProgressContainer>

					<ContinueButton
						variant="primary"
						//disabled={!answersMap[currentIndex]?.length}
						onClick={onNext}
					>
						{currentIndex + 1 < quiz.questions.length ? t("common.next") : t("common.finish")}
					</ContinueButton>
				</FixedBottomRow>

			</QuestionCard>

		</Wrapper>
	);
}



const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
	overflow: hidden;
`;

const Sidebar = styled.div`
	border-right: 1px solid var(--color-border);
    padding: ${({ $open }) => ($open ? "var(--spacing-l)" : "0")};
    width: ${({ $open }) => ($open ? "var(--spacing-8xl)" : "0")};
    overflow-y: auto; 
    overflow-x: hidden;
    transition: width .3s, padding .3s;
    display: flex;
    flex-direction: column;
`;

const SidebarHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-l);
    padding: var(--spacing-2xs) 0;

    h3 {
        margin: 0;
        font-size: var(--font-size-xl);
        color: var(--color-text);
		font-weight: 700;
    }
`;

const SidebarList = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
`;

const StepLabel = styled.div`
	font-size: var(--font-size);
	color: var(--color-text);
    transition: 0.2s;
`;

const SidebarStepItem = styled.div`
  position: relative;
  padding-left: 40px;
  cursor: pointer;
  font-weight: 600;
  min-height: 40px;
  display: flex;
  align-items: center;

  background: ${({ $active }) =>
	$active ? "var(--color-primary-muted)" : "transparent"};

  border-radius: var(--border-radius-xs);
  transition: 0.2s;

	&:hover {
		background: var(--color-background-surface-2);

        ${StepLabel} {
            color: var(--color-primary-bg);
        }
	}
`;

const StepIcon = styled.div`
	position: absolute;
	left: 10px;
	width: 22px;
	height: 22px;

  	border-radius: 50%;
		border: 2px solid
			${({ $answered, $active }) =>
			$active
				? "var(--color-primary-bg)"
				: $answered
					? "var(--color-primary-bg)"
					: "var(--color-border)"};

  	background: ${({ $answered }) =>
		$answered ? "var(--color-primary-bg)" : "transparent"};

	color: white;
	font-size: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const StepLine = styled.div`
    position: absolute;
    left: 20px;
    top: 32px;
    width: 2px;
    height: 24px;
    background: ${({ $completed }) =>
            $completed ? "var(--color-primary-bg)" : "var(--color-border)"};
    transition: background 0.3s;
	z-index: 1;
`;

const SidebarToggle = styled(Button)`
    position: absolute;
	top: var(--spacing);
	left : var(--spacing);
`;

const QuestionCard = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
`;

const QuestionContent = styled.div`
	display: flex;
    flex-direction: column;
	width: 100%;
    height: 100%;
	align-items: flex-start;
    overflow-y: auto;
`;

const QuestionItem = styled.div`
	display: flex; 
	flex-direction: column;
	width: 100%;
	gap: var(--spacing-s);
	align-items: flex-start;
	max-width: var(--spacing-12xl);    
	padding: var(--spacing-2xl);
    margin: 0 auto;
`;

const SubTitle = styled.p`
	font-weight: 600;
    font-size: var(--font-size-l);
    color: var(--color-text-muted);
`;

const Question = styled.p`
	font-size: var(--font-size-2xl); 
	line-height: 1.9rem;
	font-weight: 600; 
	color: var(--color-text);
`;

const QuestionDescription = styled.p`
	font-size: var(--font-size-l); 
	color: var(--color-text-muted);
`;

const AnswersGrid = styled.div`
    width: 100%;
	display: flex;
    gap: var(--spacing-s);
	flex-direction: column;
	margin-top: var(--spacing-l); 
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
	width: 100%;
	min-height: 100px;
	box-sizing: border-box;
    flex: 1;
`;

const FixedBottomRow = styled.div`
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing);
	border-top: 1px solid var(--color-border);
    background-color: var(--color-background-surface-1);
    z-index: 10;
    gap: var(--spacing-2xl);
`;

const ProgressContainer = styled.div`
	display: flex;
	align-items: center;
	flex: 1;
	justify-content: center;
	gap: var(--spacing-s);
`;

const ProgressBarWrapper = styled.div`
	flex: 1;
	height: 10px;
	background-color: var(--color-background-surface-2);
	border-radius: var(--border-radius-xs);
	margin: 0 var(--spacing-2xl);
	max-width: 30%;
`;

const ProgressBar = styled.div`
	height: 100%;
	width: ${({ progress }) => progress}%;
	background-color: var(--color-primary-bg);
	border-radius: var(--border-radius-xs);
	transition: width 0.3s ease;
`;

const ProgressCount = styled.div`
  font-size: var(--font-size-l);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
`;

const PrevButton = styled(Button)`
`;

const ContinueButton = styled(Button)`
`;
