import React, {useCallback, useEffect, useMemo, useState} from "react";
import { useNavigate } from "react-router-dom";
import {FlaskConical, Search, Plus, SearchX, Funnel} from "lucide-react";
import styled, {keyframes} from "styled-components";
import QuizCard from "../../components/QuizCard";
import { useTranslation } from "react-i18next";
import Header from "../../components/layout/Header";
import Button from "../../components/ui/Button";
import { getQuizzes, deleteQuiz } from "../../services/api";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import { getLangCode } from "../../services/i18n_lang";
import { Highlight } from "../../utils/hightlight.jsx";
import Input from "../../components/ui/Input";
import {useDrawer} from "../../context/drawer";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { safeNavigateToEditor } from "../../utils/navigation";

export default function HomePage() {

	const navigate = useNavigate();

	const { openDrawer } = useDrawer();
	const { t } = useTranslation();

	const [quizzes, setQuizzes] = useState([]);
	const [searchText, setSearchText] = useState("");
	const [selectedModules, setSelectedModules] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState("");


	useEffect(() => {
		setLoading(true);
		setErr("");

		getQuizzes({ onlyActive: true, lang: getLangCode() })
			.then(data => {
				console.log(data);
				setQuizzes(Array.isArray(data) ? data : [])
			})
			.catch(err => {
				setErr(err.message || String(err))
			})
			.finally(() => {
				setTimeout(() => {
					setLoading(false)
				}, 2000)
			});

	}, []);


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
	const handleEdit = (quiz) => {
		const id = quiz?.id_quiz ?? quiz?.id;
    	safeNavigateToEditor(navigate, id);
  };

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

	const handleOpenFilterDrawer = () => {
		openDrawer("filter", {
			modules: allModules,
			tags: allTags,
			selectedModules,
			selectedTags,
			setSelectedModules,
			setSelectedTags,
		});
	};

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
						<AnimatedDiv>
							<SearchFilterContainer>
								<Input
									icon={<Search size={20} color={"var(--color-text-muted)"} />}
									placeholder={t("common.search")}
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									size="m"
									width="100%"
								/>

								<Button key="filter" onClick={handleOpenFilterDrawer} aria-label="Filters">
									<Funnel size={20} />
									{t("common.filter")}
								</Button>
							</SearchFilterContainer>
						</AnimatedDiv>
					)}

					{!err && (
						filteredQuizzes.length === 0 && !loading ? (
							<NoCards>
								<SearchX size={50} color={"var(--color-disabled)"} />
								<NoCardsText>{t("quiz.empty")}</NoCardsText>
							</NoCards>
						) : (
							<ResponsiveMasonry
								columnsCountBreakPoints={{ 350: 1, 600: 2, 900: 3, 1200: 5 }}
							>
								<Masonry gutter={"var(--spacing)"}>
									{filteredQuizzes.map((q, index) => (
										<AnimatedDiv key={q.id_quiz} style={{ animationDelay: `${index * 0.05}s` }}>
											<QuizCard
												{...q}
												loading={loading}
												title={<Highlight text={q.title} query={searchText} />}
												description={<Highlight text={q.quiz_description} query={searchText} />}
												onEdit={() => handleEdit(q)}
												onDelete={handleDelete}
												onClick={() => q.is_active && navigate(`/quizzes/${q.id_quiz}`)}
											/>
										</AnimatedDiv>
									))}
								</Masonry>
							</ResponsiveMasonry>
						)
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

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`;

const AnimatedDiv = styled.div`
	opacity: 0;
    width: 100%;
  	animation: ${fadeIn} 0.5s ease forwards;
`;

const SearchFilterContainer = styled.div`
	display: flex;
	gap: var(--spacing-s);
	margin-bottom: var(--spacing-l);
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
