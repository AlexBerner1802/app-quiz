import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import QuestionItem from "./QuestionItem";
import { t } from "i18next";
import { Timer } from "lucide-react";

// util - formate mm:ss
function fmt(t) {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function QuizQuestions({ questions }) {
    const list = Array.isArray(questions) ? questions : [];

    // selections: { [questionId]: Set<answerId> }
    const [selections, setSelections] = useState(() => ({}));
    const [validated, setValidated] = useState(false);
    const [score, setScore] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    // timer on while quiz is not finished
    useEffect(() => {
        if (validated) return;
        const id = setInterval(() => setElapsed(t => t + 1), 1000);
        return () => clearInterval(id);
    }, [validated]);

    const toggleAnswer = (qId, aId) => {
        if (validated) return;
        setSelections(prev => {
        const next = { ...prev };
        const cur = new Set(next[qId] ?? []);
        cur.has(aId) ? cur.delete(aId) : cur.add(aId);
        next[qId] = cur;
        return next;
        });
    };

    const onValidate = () => {
        let correctCount = 0;

        for (const q of list) {
            const qId = q.id ?? q.question_id ?? q.title;
            const selected = selections[qId] ?? new Set();
            for (const a of (q.answers ?? [])) {
                const aId = a.id ?? a.answer_text;
                if (a.is_correct && selected.has(aId)) {
                    correctCount += 1;
                }
            }
        }

        setScore(correctCount);
        setValidated(true);
    };

    const total = list.length;
    const canValidate = total > 0 && !validated;

    // stats display
    const headerRight = useMemo(() => {
        if (!validated) return ` ${fmt(elapsed)}`;
        return `Score : ${score} • ${fmt(elapsed)}`;
    }, [validated, score, elapsed]);

    if (list.length === 0) {
        return <Empty>{t("quiz.show.noQuestion")}</Empty>;
    }

    return (
        <Wrapper>
        <TopBar>
            <h2>{t("quiz.sections.questions")}</h2>
                <div>
                    
                    {headerRight}
                    <Timer size={20} />
                </div>
        </TopBar>

        <Section>
            {list.map((q, idx) => {
            const qId = q.id ?? q.question_id ?? q.title;
            const selected = selections[qId] ?? new Set();
            return (
                <QuestionItem
                key={qId}
                index={idx + 1}
                question={q}
                selected={selected}
                onToggle={(aId) => toggleAnswer(qId, aId)}
                showResult={validated}
                />
            );
            })}
        </Section>

        <Actions>
            {canValidate ? (
            <ValidateButton type="button" onClick={onValidate}>
                {t("quiz.show.finished")}
            </ValidateButton>
            ) : (
            validated && <ValidatedNote>{t("quiz.show.validation")}</ValidatedNote>
            )}
        </Actions>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    display: grid;
    gap: var(--spacing);
`;

const TopBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    h2 { margin: 0; }
    div { color: var(--color-text-muted); }
`;

const Section = styled.section`
    display: grid;
    gap: var(--spacing);
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    
`;

const ValidateButton = styled.button`
    padding: 10px 56px;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    background: var(--color-primary-bg);
    color: var(--color-text);
    cursor: pointer;
    &:hover { filter: brightness(1.05); }
`;

const ValidatedNote = styled.span`
    color: var(--color-text-muted);
`;

const Empty = styled.p`
    color: var(--color-text-muted);
    margin: 0;
`;
