import React, {useCallback, useEffect, useMemo, useState} from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Plus, SearchX } from "lucide-react";
import styled from "styled-components";
import QuizCard from "../../components/QuizCard";
import { useTranslation } from "react-i18next";
import Header from "../../components/layout/Header";
import Button from "../../components/ui/Button";
import { getQuizzes, deleteQuiz } from "../../services/api";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import { getLangCode } from "../../services/i18n_lang";
import { Highlight } from "../../utils/hightlight.jsx";
import SelectMultiple from "../../components/ui/SelectMultiple";

export default function HomePage() {

	const navigate = useNavigate();
	const { t, i18n } = useTranslation();

	const [quizzes, setQuizzes] = useState([]);
	const [searchText, setSearchText] = useState("");
	const [selectedModules, setSelectedModules] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState("");


	useEffect(() => {
		let alive = true;

		(async () => {
			try {
				setErr(""); // clear previous errors
				setLoading(true);

				const data = await getQuizzes({ onlyActive: true, lang: getLangCode() })

				console.log(data);
				if (!alive) return;

				setQuizzes(Array.isArray(data) ? data : []);
			} catch (e) {
				if (alive) setErr(e.message || String(e));
			} finally {
				if (alive) {
					setTimeout(() => {
						setLoading(false);
					}, 2000);
				}
			}
		})();

		return () => { alive = false; };
	}, [i18n.language]);


	const filteredQuizzes = useMemo(() => {
		return quizzes.filter((q) => {
			const searchMatch =
				q.title.toLowerCase().includes(searchText.toLowerCase()) ||
				q.quiz_description.toLowerCase().includes(searchText.toLowerCase());

			const modulesArray = Array.isArray(q.modules)
				? q.modules.map((m) => (typeof m === "string" ? m : m.module_name))
				: [];

			const tagsArray = Array.isArray(q.tags)
				? q.tags.map((t) => (typeof t === "string" ? t : t.tag_name))
				: [];

			const moduleMatch =
				selectedModules.length === 0 || modulesArray.some((m) => selectedModules.includes(m));

			const tagMatch =
				selectedTags.length === 0 || tagsArray.some((t) => selectedTags.includes(t));

			return searchMatch && moduleMatch && tagMatch;
		});
	}, [quizzes, searchText, selectedModules, selectedTags]);


	// Open the editor
	const handleEdit = useCallback(
		(id) => {
			navigate(`/quizzes/${id}/edit`);
		},
		[navigate] // dependency on navigate only
	);

	const handleDelete = useCallback(
		async (id_quiz) => {
			const confirmText = t("quiz.confirmDelete");
			if (!window.confirm(confirmText)) return;
			try {
				await deleteQuiz(id_quiz);
				setQuizzes((prev) => prev.filter((q) => q.id_quiz !== id_quiz));
			} catch (e) {
				alert(e.message || "Erreur lors de la suppression");
			}
		},
		[t] // dependencies: only `t` because `setQuizzes` is stable
	);

	const allModules = useMemo(() => {
		const modulesSet = new Set();
		quizzes.forEach((q) => {
			if (Array.isArray(q.modules)) {
				q.modules.forEach((m) => modulesSet.add(typeof m === "string" ? m : m.module_name));
			}
		});
		return Array.from(modulesSet).sort();
	}, [quizzes]);

	const allTags = useMemo(() => {
		const tagsSet = new Set();
		quizzes.forEach((q) => {
			if (Array.isArray(q.tags)) {
				q.tags.forEach((t) => tagsSet.add(typeof t === "string" ? t : t.tag_name));
			}
		});
		return Array.from(tagsSet).sort();
	}, [quizzes]);

	console.log(filteredQuizzes)
	return (
		<>
			<FaviconTitle title={t("pages.homePage")} iconHref={faviconUrl} />

			<Main>

				<Header
					title={t("pages.home.title")}
					icon={<FlaskConical size={20} aria-hidden="true" />}
					actions={[
						<NewQuizButton
							key="new"
							onClick={() => navigate("/quizzes/new")}
							aria-label={t("actions.newQuiz")}
							title={t("actions.newQuiz")}
						>
							<Plus size={16} aria-hidden="true" />
							{t("actions.newQuiz")}
						</NewQuizButton>,
					]}
				/>

				<Content>
					{err && <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre>}

					{!err && (
						<SearchFilterContainer>
							<SearchInput
								placeholder={t("searchPlaceholder")}
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
							/>
							<SelectMultiple
								options={allModules}
								value={selectedModules}
								onChange={setSelectedModules}
								placeholder={t("filterModules")}
							/>
							<SelectMultiple
								options={allTags}
								value={selectedTags}
								onChange={setSelectedTags}
								placeholder={t("filterTags")}
							/>
						</SearchFilterContainer>
					)}

					{!err && (
						<QuizGrid>
							{(!filteredQuizzes || filteredQuizzes.length === 0) && !loading ? (
								<NoCards>
									<SearchX size={50} color={"var(--color-disabled)"} />
									<NoCardsText>{t("quiz.empty")}</NoCardsText>
								</NoCards>
							) : (
								filteredQuizzes.map((q) => (
									<QuizCard
										key={q.id_quiz}
										{...q}
										loading={loading} // pass loading flag
										title={<Highlight text={q.title} query={searchText} />}
										description={<Highlight text={q.quiz_description} query={searchText} />}
										onEdit={handleEdit}
										onDelete={handleDelete}
										onClick={() => q.is_active && navigate(`/quizzes/${q.id_quiz}`)}
									/>
								))
							)}
						</QuizGrid>

					)}
				</Content>
			</Main>
		</>
  );
}

const Main = styled.main`
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
    background-color: var(--color-background);
`;

const NewQuizButton = styled(Button)`
`;

const Content = styled.section`
	flex: 1;
	padding: var(--spacing-xl);
`;

const SearchFilterContainer = styled.div`
  display: flex;
  gap: var(--spacing-s);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-l);
`;

const SearchInput = styled.input`
  flex: 1;
  padding: var(--spacing-xs);
  font-size: var(--font-size);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
`;


const QuizGrid = styled.section`
	display: grid;
    width: 100%;
    min-height: 50%;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: var(--spacing);
`;

const NoCards = styled.div`
	flex: 1;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	gap: var(--spacing);
	font-size: var(--font-size-l);
	font-weight: 600;
	color: var(--color-disabled);
`;

const NoCardsText = styled.p`
	font-size: var(--font-size-xl);
	font-weight: 500;
`;
