import React from "react";
import styled from "styled-components";
import CheckBox from "../../components/ui/CheckBox";

export default function QuestionItem({ index, question, selected, onToggle, showResult }) {
    const title = question.question_titre || question.title || "Sans titre";
    const desc = question.question_description || question.description || "";
    const answers = Array.isArray(question.answers) ? question.answers : [];
    /*
    const [selected, setSelected] = useState(() => new Set());

    const toggle = (id) => {
        setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
        });
    };*/

    // Show a case
    const renderCheck = (ans) => {
        const id = ans.id ?? ans.answer_text;
        const isSelected = selected?.has?.(id);
        const isCorrect  = !!ans.is_correct;

        // Display status after validation
        let status; // "correct" | "wrong" | "undefined"
        if (showResult) {
            if (isCorrect) status = "correct";
            else if (isSelected) status = "wrong";
        }

        return (
            <Li key={id} data-status={status}>
                <CheckBox
                    label={ans.answer_text}
                    checked={!!isSelected}
                    onChange={() => onToggle?.(id)}
                    disabled={!!showResult}
                >
                    {ans.answer_text}
                </CheckBox>
            </Li>
        );
    };

    return (
        <Card>
            <h3>{index}. {title}</h3>
            {desc && <p>{desc}</p>}
            {answers.length > 0 && (
                <List>
                    {answers.map(renderCheck)}
                </List>
            )}
        </Card>
    );
}

const Card = styled.article`
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: var(--spacing);
    display: grid;
    gap: var(--spacing-2xs);
    color: var(--color-text);
    background-color: var(--color-background-surface-2);

    h3 { margin: 0; font-size: var(--font-size); }
    p  { margin: 0; }
`;

const List = styled.ul`
    margin: 0;
    padding-left: 0;
    list-style: none;
    display: grid;
    gap: 8px;
`;

const Li = styled.li`
    border-radius: 10px;

    &[data-status="correct"] {
        background: rgba(34, 197, 94, 0.18); /* green-500 */
        outline: 1px solid rgba(34, 197, 94, 0.35);
    }

    &[data-status="wrong"] {
        background: rgba(239, 68, 68, 0.18); /* red-500 */
        outline: 1px solid rgba(239, 68, 68, 0.35);
    }
`;