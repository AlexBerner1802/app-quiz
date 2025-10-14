import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getQuiz } from "/src/services/api.js";
import QuizViewer from "./QuizViewer"
import { useTranslation } from "react-i18next";


export default function ShowQuiz() {

    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await getQuiz(id);
                if (!alive) return;
                setQuiz(data);
            } catch (e) {
                setErr(e.message || String(e));
            } finally {
                if (alive) setLoading(false);
            }
            })();
            return () => { alive = false; };
        }, [id]);

        if (loading) return <Page><p>{t("common.loading")}</p></Page>;

        if (err) {
            if (/403/.test(err) || /inactive/i.test(err)) {
            navigate("/");
            return null;
            }
            return <Page><ErrorBox>{t("common.error")}{err}</ErrorBox></Page>;
        }

        if (!quiz) return <Page><p>{t("quiz.show.cantFind")}</p></Page>;

        return (
            <Page>
            <QuizViewer quiz={quiz} />
            </Page>
        );
        }

const Page = styled.div`
    padding: var(--spacing-xl);
    background-color: var(--color-background);
`;

const ErrorBox = styled.pre`
    color: crimson;
    white-space: pre-wrap;
`;