import React from "react";
import styled from "styled-components";
import QuizHeader from "./QuizHeader";
import QuizChips from "./QuizChips";
import QuizQuestions from "./QuizQuestions";

export default function QuizViewer({ quiz }) {
    return (
        <Wrapper>
        <QuizHeader
            title={quiz.title}
            createdAt={quiz.created_at}
            updatedAt={quiz.updated_at}
            description={quiz.quiz_description}
            coverImageUrl={quiz.cover_image_url}
        />

        <Row>
            <QuizChips label="Modules" items={quiz.modules} itemKey="id" itemLabel="module_name" />
            <QuizChips label="Tags" items={quiz.tags} itemKey="id" itemLabel="tag_name" variant="secondary" />
        </Row>

        <QuizQuestions questions={quiz.questions} />
        </Wrapper>
    );
}

const Wrapper = styled.div`
    display: grid;
    gap: var(--spacing);
`;

const Row = styled.div`
    display: grid;
    gap: var(--spacing);
    color: var(--color-text);
`;
