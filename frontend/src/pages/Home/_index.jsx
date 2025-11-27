import React, {useCallback, useEffect, useMemo, useState} from "react";
import { useNavigate } from "react-router-dom";
import {FlaskConical, Search, Plus, SearchX, Funnel, Loader2} from "lucide-react";
import styled, {keyframes} from "styled-components";
import QuizCard from "../../components/QuizCard";
import { useTranslation } from "react-i18next";
import Header from "../../components/layout/Header";
import Button from "../../components/ui/Button";
import {getQuizzes, deleteQuiz, getModules, getTags} from "../../services/api";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import { getLangCode } from "../../services/i18n_lang";
import Input from "../../components/ui/Input";
import {useDrawer} from "../../context/drawer";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { safeNavigateToEditor } from "../../utils/navigation";
import i18n from "i18next";


export default function HomePage() {

	const navigate = useNavigate();

	const { openDrawer } = useDrawer();
	const { t } = useTranslation();

	const currentLang = i18n.language;
	const [quizzes, setQuizzes] = useState([]);
	const [searchText, setSearchText] = useState("");
	const [selectedModules, setSelectedModules] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showLoader, setShowLoader] = useState(true);
	const [err, setErr] = useState("");
	const [modules, setModules] = useState([]);
	const [tags, setTags] = useState([]);

	useEffect(() => {
		setLoading(true);
		setErr("");

		const init = async () => {

			const [allModules, allTags] = await Promise.all([getModules(), getTags()]);
			setModules(allModules[currentLang]);
			setTags(allTags[currentLang]);

			getQuizzes({ onlyActive: true, lang: getLangCode() })
				.then(data => {
					console.log(data);
					setQuizzes(data);
				})
				.catch(err => {
					setErr(err.message || String(err))
				})
				.finally(() => {
					setShowLoader(false);
					setTimeout(() => setLoading(false), 1000);
				});
		}

		init().then(() => false);

	}, [currentLang]);


	const filteredQuizzes = useMemo(() => {
		return quizzes.filter((q) => {
			const quiz = q || {};

			// Search filter
			const searchMatch =
				(quiz.title || "").toLowerCase().includes(searchText.toLowerCase()) ||
				(quiz.description || "").toLowerCase().includes(searchText.toLowerCase());

			const moduleIds = Array.isArray(quiz.modules)
				? quiz.modules.map((m) => m.id)
				: [];

			const tagIds = Array.isArray(quiz.tags)
				? quiz.tags.map((tag) => tag.id)
				: [];

			// Module filter by ID
			const moduleMatch =
				selectedModules.length === 0 ||
				moduleIds.some((id) => selectedModules.includes(id));

			// Tag filter by ID
			const tagMatch =
				selectedTags.length === 0 ||
				tagIds.some((id) => selectedTags.includes(id));

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
		[t]
	);

	const handleOpenFilterDrawer = () => {
		openDrawer("filter", {
			modules: modules,
			tags: tags,
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

				{loading && (
					<LoadingWrapper $fadingOut={!showLoader}>
						<Loader2 className="spin" size={32} strokeWidth={2.5} color={"var(--color-primary-bg, #2684ff)"}/>
					</LoadingWrapper>
				)}

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

								{
									modules && tags && (
										<Button key="filter" onClick={handleOpenFilterDrawer} aria-label="Filters">
											<Funnel size={20} />
											{t("common.filter")}
										</Button>
									)
								}
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
												quiz={q}
												searchText={searchText}
												loading={loading}
												onEdit={() => handleEdit(q)}
												onDelete={() => handleDelete(q.id_quiz)}
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

const NewQuizButton = styled(Button)`
`;

const Content = styled.section`
	flex: 1;
	padding: var(--spacing);
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
