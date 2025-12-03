import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getQuiz } from "../../services/api";
import QuizViewer from "./QuizViewer";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export default function ShowQuiz() {
	const { t, i18n } = useTranslation();
	const { id } = useParams();
	const navigate = useNavigate();

	const [quiz, setQuiz] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showLoader, setShowLoader] = useState(true);
	const [err, setErr] = useState("");

	useEffect(() => {
		let alive = true;

		const lang = i18n.language.split('-')[0];

		getQuiz(id, lang)
			.then(data => alive && setQuiz(data))
			.catch(e => alive && setErr(e.message || String(e)))
			.finally(() => {
				if (!alive) return;
				setShowLoader(false);
				setTimeout(() => setLoading(false), 2000);
			});

		return () => { alive = false; };
	}, [id, i18n.language]);

	if ((err || !quiz) && !loading) {
		if (/403/.test(err) || /inactive/i.test(err)) {
			navigate("/");
			return null;
		}
		return <Page>{t("common.error")}: {err || t("quiz.show.cantFind")}</Page>;
	}

	return (
		<Page>
			{loading && <LoadingWrapper $fadingOut={!showLoader}>
				<Loader2 className="spin" size={32} strokeWidth={2.5} color={"var(--color-primary-bg, #2684ff)"}/>
			</LoadingWrapper>}

			<QuizViewer quiz={quiz} />
		</Page>
	);
}

const Page = styled.div`
    min-height: 100vh;
    background-color: var(--color-background);
`;

const LoadingWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    inset: 0; // top:0; left:0; right:0; bottom:0;
    background-color: var(--color-background, #fff);
    color: var(--color-primary-bg, #2684ff);
    opacity: ${({ $fadingOut }) => ($fadingOut ? 0 : 1)};
    transition: opacity 0.4s ease;
    z-index: 100;

    .spin {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        100% {
            transform: rotate(360deg);
        }
    }
`;
