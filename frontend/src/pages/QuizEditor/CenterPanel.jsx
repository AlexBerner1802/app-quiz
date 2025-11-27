// QuizEditor/CenterPanel.jsx

import React from "react";
import styled from "styled-components";
import {ChevronDown, ChevronUp, MonitorCheck, PenLine} from "lucide-react";
import Input from "../../components/ui/Input";
import TextArea from "../../components/ui/TextArea";
import CheckboxGroup from "../../components/ui/CheckboxGroup";
import TagSelect from "../../components/ui/TagSelect";
import ImageUploader from "../../components/ui/ImageUploader";
import Collapse from "../../components/ui/Collapse";
import QuestionsContent from "./QuestionsContent";
import {useTranslation} from "react-i18next";

export default function CenterPanel({
										quiz,
										currentLang,
										leftSidebarVisible,
										rightSidebarVisible,
										quizExpanded,
										setQuizExpanded,
										questionsExpanded,
										setQuestionsExpanded,
										modules,
										tags,
										translation,
										updateQuizField,
										updateTranslationField,
										addSingleQuestion,
										moveQuestion,
										questionRefs,
									}) {

	const {t} = useTranslation();
	console.log(translation);

	return (
		<Wrapper
			$leftSidebarVisible={leftSidebarVisible}
			$rightSidebarVisible={rightSidebarVisible}
		>
			<Inner>

				{/* Quiz general info */}
				<QuizBlock $isOpen={quizExpanded}>
					<TitleRow onClick={() => setQuizExpanded(!quizExpanded)}>
						<Title>{t("quiz.general_quiz_information")}</Title>
						<TitleRowRight>
							{
								translation.is_active ?
									<ActiveBadge>Quiz active <MonitorCheck size={18} color={"var(--color-success-bg"}/></ActiveBadge> :
									<InactiveBadge>Quiz inactive <MonitorCheck size={18} color={"var(--color-text-muted"}/></InactiveBadge>
							}
							{quizExpanded ? (
								<ChevronDown size={24} strokeWidth={2} />
							) : (
								<ChevronUp size={24} strokeWidth={2} />
							)}
						</TitleRowRight>
					</TitleRow>

					<Collapse
						isOpen={quizExpanded}
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "var(--spacing-s)",
						}}
					>
						<Input
							icon={
								<PenLine
									aria-hidden="true"
									className="icon"
									size={20}
									color={"var(--color-text-muted"}
								/>
							}
							value={translation.title}
							onChange={(e) => updateTranslationField({ title: e.target.value })}
							size="m"
							width="100%"
							placeholder={t("quiz.fields.title") || "Sans titre"}
						/>

						<TextArea
							size="m"
							width="100%"
							rows={8}
							value={translation.description}
							onChange={(e) =>
								updateTranslationField({ description: e.target.value })
							}
							icon={
								<PenLine
									aria-hidden="true"
									className="icon"
									size={20}
									color={"var(--color-text-muted"}
								/>
							}
							placeholder={t("quiz.fields.description") || "Sans titre"}
						/>

						<ImageUploader
							style={{ marginBottom: "var(--spacing-s)" }}
							value={quiz.cover_image_file || quiz.cover_image_url || null}
							onChange={(file) =>
								updateQuizField({ cover_image_file: file, cover_image_url: "" })
							}
							onClear={() =>
								updateQuizField({ cover_image_file: null, cover_image_url: "" })
							}
							placeholder={t("quiz.fields.coverImage")}
							changeText={t("quiz.hints.changeImage")}
						/>

						<CheckboxGroup
							wrapperStyle={{ marginBottom: "var(--spacing-s)" }}
							label={t("quiz.sections.module")}
							options={(modules?.[currentLang] ?? []).map((m) => ({
								id: m.id,
								label: m.name,
							}))}
							value={translation.modules}
							onChange={(ids) => updateTranslationField({ modules: ids })}
							direction="row"
						/>

						<TagSelect
							wrapperStyle={{ marginBottom: "var(--spacing-s)" }}
							label={t("quiz.sections.existingTag")}
							placeholder={t("quiz.sections.tagAdd")}
							prefixAdd="Ajouter"
							allowNew
							value={translation.tags}
							onChange={(arr) =>
								updateTranslationField({
									tags: arr,
								})
							}
							width="100%"
							fetchFromApi={false}
							suggestions={(tags?.[currentLang] ?? []).map((m) => ({
								id: m.id,
								label: m.name,
							}))}
						/>
					</Collapse>
				</QuizBlock>

				{/* Questions section */}
				<QuestionsBlock $isOpen={questionsExpanded}>
					<TitleRow onClick={() => setQuestionsExpanded(!questionsExpanded)}>
						<Title>{t("quiz.questions")}</Title>
						<TitleRowRight>
							<Subtitle>{translation.questions && translation.questions.length > 0 ? translation.questions.length+" questions" : ""}</Subtitle>
							{questionsExpanded ? (
								<ChevronDown size={24} strokeWidth={2} />
							) : (
								<ChevronUp size={24} strokeWidth={2} />
							)}
						</TitleRowRight>
					</TitleRow>

					<Collapse isOpen={questionsExpanded}>
						<QuestionsContent
							translation={translation}
							updateTranslationField={updateTranslationField}
							setIsDirty={() => updateTranslationField({})}
							questionRefs={questionRefs}
							moveQuestion={moveQuestion}
							addSingleQuestion={addSingleQuestion}
						/>
					</Collapse>
				</QuestionsBlock>

				<Footer>
					<FooterNote>
						Rafisa VD © {new Date().getFullYear()} • Quiz App • v1.0
					</FooterNote>
				</Footer>
			</Inner>
		</Wrapper>
	);
}

/* Styled Components */
const Wrapper = styled.section`
	position: relative;
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: var(--spacing-l) var(--spacing-l) 0; 
	overflow-y: auto;
	overflow-x: hidden;
	transition: all 0.3s ease;
	scrollbar-width: none;
	-ms-overflow-style: none;
	&::-webkit-scrollbar {
		width: 0;
		height: 0;
	}
	${({ $leftSidebarVisible }) =>
	!$leftSidebarVisible &&
	`
    	margin-left: calc(-1 * var(--spacing-8xl) + var(--spacing-2xl));
    `}
	${({ $rightSidebarVisible }) =>
	!$rightSidebarVisible &&
	`
    	margin-right: calc(-1 * var(--spacing-8xl) + var(--spacing-2xl));
    `}
`;

const Inner = styled.div`
	width: 100%;
	max-width: var(--spacing-12xl);
	margin: 0 auto;
	gap: var(--spacing);
	display: flex;
	flex-direction: column;
`;

const QuizBlock = styled.div`
	display: flex;
	flex-direction: column;
	padding-bottom: ${({ $isOpen }) => $isOpen ? "var(--spacing-l)" : "var(--spacing-xs)"};
	border-bottom: 1px solid var(--color-divider);
	transition: all 0.2s ease;
	margin-bottom: var(--spacing);
`;

const QuestionsBlock = styled.div`
	display: flex;
	flex-direction: column;
	padding-bottom: ${({ $isOpen }) => $isOpen ? "var(--spacing-l)" : "var(--spacing-xs)"};
    border-bottom: ${({ $isOpen }) => $isOpen ? "" : "1px solid var(--color-divider)"};
	transition: all 0.2s ease;
	margin-bottom: var(--spacing);
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	user-select: none;
	padding: 0 0 var(--spacing-l) 0;
	transition: all 0.2s ease;

	&:hover {
		color: var(--color-primary-bg);
		$(ChevronUp) {
			transition: all 0.2s ease;
			stroke: var(--color-primary-bg);
		}
		$(ChevronDown) {
			transition: all 0.2s ease;
			stroke: var(--color-primary-bg);
		}
	}
`;

const Title = styled.p`
	font-size: var(--font-size-xl);
	font-weight: 500;
	color: var(--color-text);
`;

const TitleRowRight = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: var(--spacing);
`;

const Subtitle = styled.p`
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-text-muted);
`;

const ActiveBadge = styled.p`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-success-bg);
`;

const InactiveBadge = styled.p`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-text-muted);
`;

const Footer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`;

const FooterNote = styled.div`
	font-size: var(--font-size-xs);
	color: var(--color-text-muted);
	text-align: center;
    padding: var(--spacing);
`;
