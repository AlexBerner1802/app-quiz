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

	return (
		<Wrapper>

			<Sidebar $open={sidebarOpen}>
				<SidebarHeader>
					<h3>{t("common.questions")}</h3>
				</SidebarHeader>

				<SidebarList>
					{quiz?.questions && quiz.questions.map((q, i) => (
						<SidebarItem
							key={i}
							$active={i === currentIndex}
							onClick={() => {
								onJump(i);
							}}
						>
							{t("common.question")}{` ${i + 1}`}
						</SidebarItem>
					))}
				</SidebarList>
			</Sidebar>

			<QuestionCard>

				<SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)} variant={"ghost"}>
					<PanelLeft size={26} />
				</SidebarToggle>

				<QuestionContent>
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
						disabled={!answersMap[currentIndex]?.length}
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
`;

const Sidebar = styled.div`
    width: ${({ $open }) => ($open ? "var(--spacing-8xl)" : "0")};
    overflow: hidden;
    transition: width 0.3s ease, padding 0.3s ease;
    border-right: 1px solid var(--color-border);
    background-color: var(--color-background-surface-1);
    display: flex;
    flex-direction: column;
    padding: ${({ $open }) => ($open ? "var(--spacing-l)" : "0")};
    box-sizing: border-box;
`;

const SidebarHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing);

    h3 {
        margin: 0;
        font-size: var(--font-size-xl);
        color: var(--color-text);
    }
`;

const SidebarList = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
`;

const SidebarItem = styled.div`
    padding: var(--spacing);
    border-radius: var(--border-radius-xs);
    background: ${({ $active }) =>
	$active ? "var(--color-primary-muted)" : "var(--color-background-surface-3)" };
    border: 2px solid ${({ $active }) =>
	$active ? "var(--color-primary-bg)" : "var(--color-border)"};
    cursor: pointer;
    font-weight: 600;

    &:hover {
        background: var(--color-background-surface-1);
    }
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
	align-items: center;
    gap: var(--spacing-s);
    transition: width 0.3s ease;
	position: relative;
`;

const QuestionContent = styled.div`
	display: flex; 
	flex-direction: column;
	width: 100%;
	gap: var(--spacing-s);
	align-items: flex-start;
	max-width: var(--spacing-12xl);
    padding: var(--spacing-2xl);
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
    position: absolute;
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
