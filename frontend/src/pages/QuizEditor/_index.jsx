// QuizEditor/_index.jsx

import React, { useRef, useState, useEffect, useMemo } from "react";
import { FilePenLine, Languages, BadgeQuestionMark, Loader2, Save } from "lucide-react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import faviconUrl from "../../assets/images/favicon.ico?url";
import Button from "../../components/ui/Button";
import styled from "styled-components";
import Header from "../../components/layout/Header";
import UnsavedChangesGuard from "../../components/UnsavedChangesGuard";
import FaviconTitle from "../../components/layout/Icon.jsx";
import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CenterPanel from "./CenterPanel";
import {getQuizEditor, getModules, getTags, saveQuiz} from "../../services/api";
import {useAuth} from "../../context/auth";


export default function NewQuiz() {
	const { t, i18n } = useTranslation();
	const { user } = useAuth();
	const params = useParams();
	const rawQuizId = params.id ?? params.quizId ?? null;
	const quizId = rawQuizId === "undefined" || rawQuizId === "null" || !rawQuizId ? null : rawQuizId;

	const isEdit = !!quizId;

	const [quiz, setQuiz] = useState({});
	const [showLoader, setShowLoader] = useState(true);
	const [loaderVisible, setLoaderVisible] = useState(true);
	const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
	const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
	const [quizExpanded, setQuizExpanded] = useState(true);
	const [questionsExpanded, setQuestionsExpanded] = useState(true);
	const [modules, setModules] = useState([]);
	const [tags, setTags] = useState([]);
	const [warnedLanguages, setWarnedLanguages] = useState(new Set());

	// Define quiz languages based on i18n resources
	const quizLanguages = useMemo(
		() => Object.keys(i18n.options.resources).map((code) => ({ code, label: t(`lang.${code}`, { defaultValue: code }) })),
		[i18n, t]
	);

	console.log("user", user);

	// Template for empty translation
	const emptyDraft = useMemo(
		() => ({
			title: "",
			description: "",
			questions: [],
			is_active: false,
			cover_image_file: null,
			cover_image_url: "",
			selectedModuleIds: [],
			selectedTags: [],
			selectedTagIds: [],
			is_dirty: false,
			has_translation: false,
		}),
		[]
	);

	const initialLang = i18n.language || quizLanguages[0].code;

	const [currentLang, setCurrentLang] = useState(initialLang);

	const [translations, setTranslations] = useState({
		[initialLang]: { ...emptyDraft }
	});

	const questionRefs = useRef({});


	// ------------------ Init ------------------
	useEffect(() => {
		const init = async () => {
			try {
				const [allModules, allTags] = await Promise.all([getModules(), getTags()]);
				setModules(allModules || []);
				setTags(allTags || []);

				if (!quizId) return;

				const quizData = await getQuizEditor(quizId);
				console.log("Fetched quiz data:", quizData);

				const newTranslations = {};
				quizData.translations?.forEach((t) => {
					newTranslations[t.lang] = {
						title: t.title ?? "",
						description: t.description ?? "",
						modules: t.modules ?? [],
						tags: t.tags ?? [],
						is_active: t.is_active ?? false,
						has_translation: true,
						is_dirty: false,
						lang: t.lang,
						questions: (t.questions || []).map((q) => ({
							id: q.id,
							title: q.title ?? "",
							description: q.description ?? "",
							options: q.answers?.map((a) => a.text ?? "") || [],
							answer_ids: q.answers?.map((a) => a.id ?? undefined) || [],
							correct_indices: q.answers
								?.map((a, i) => (a.is_correct ? i : -1))
								.filter((i) => i >= 0) || [],
						})),

					};
				});

				setQuiz({
					id_quiz: quizData.id_quiz,
					modules: allModules || [],
					tags: allTags || [],
					cover_image_url: quizData.cover_image_url || "",
					cover_image_file: quizData.cover_image_file || "",
				});

				console.log("Translations data:", newTranslations);
				setTranslations(newTranslations);
			} catch (e) {
				console.error("[NewQuiz] init error:", e);
				alert(e.message || "Erreur de chargement");
			} finally {
				setShowLoader(false);
				setTimeout(() => setLoaderVisible(false), 400);
			}
		};

		init().then(() => false);
	}, [quizId]);

	const translation = translations[currentLang] ?? emptyDraft;


	const updateQuizField = (updater) => {
		setQuiz(prev => typeof updater === "function" ? updater(prev) : { ...prev, ...updater });
	};

	const updateTranslationField = (updater) => {
		setTranslations((prev) => {
			const prevDraft = prev[currentLang] || {};
			const nextDraft = typeof updater === "function" ? updater(prevDraft) : { ...prevDraft, ...updater };
			return {
				...prev,
				[currentLang]: { ...prevDraft, ...nextDraft, questions: nextDraft.questions ?? prevDraft.questions, is_dirty: true },
			};
		});
	};

	const addSingleQuestion = () => {
		const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		updateTranslationField((prev) => ({
			questions: [...(prev.questions || []), { id, title: "", description: "", showDescription: false, options: ["", "", ""], correct_indices: [] }],
		}));
	};

	const moveQuestion = (index, direction) => {
		const newQs = [...translation.questions];
		if (direction === "up" && index > 0) [newQs[index - 1], newQs[index]] = [newQs[index], newQs[index - 1]];
		if (direction === "down" && index < newQs.length - 1) [newQs[index], newQs[index + 1]] = [newQs[index + 1], newQs[index]];
		updateTranslationField({ questions: newQs });
	};


	// ------------------ Save ------------------
	const onSave = async ({ saveAll = true, navigateAfter = false } = {}) => {
		try {
			const { modules, tags, ...quizRest } = quiz;

			const translationsToSend = saveAll
				? translations
				: { [currentLang]: translations[currentLang] };

			const payload = {
				...quizRest,
				owner_id: user.localAccountId,
				translations: Object.fromEntries(
					Object.entries(translationsToSend).map(([lang, t]) => [
						lang,
						{
							...t,
							lang,
							is_active: t.is_active ?? false,
							description: t.description ?? "",
							questions: (t.questions || []).map((q) => ({
								id: Number.isInteger(q.id) ? q.id : null,
								title: q.title ?? "",
								description: q.description ?? "",
								options: q.options ?? [],
								correct_indices: q.correct_indices ?? [],
							})),
							modules: (t.modules || []).map((m) => ({ id: m.id })),
							tags: (t.tags || []).map((tg) => ({ id: tg.id })),
						},
					])
				),
			};

			console.log("payload", payload);

			// Use unified saveQuiz function
			const res = await saveQuiz(payload, quizId ? quiz.id_quiz : null);

			console.log("res", res);

			if (res) {
				alert(t("quiz.saved_successfully"));

				if (navigateAfter) {
					window.location.href = "/";
				}
			} else {
				alert(t("quiz.saved_successfully"));
			}
		} catch (e) {
			console.error(e);

			// If backend sent error_code
			const backendErrorCode = e?.response?.error_code || e.message;

			// Map to i18n key
			const message = t(`errors.${backendErrorCode}`, e.message);
			alert(message);
		}
	};

	const handleSave = async () => {
		const otherDirty = quizLanguages.some(
			(l) => l.code !== currentLang && translations[l.code]?.is_dirty
		);

		let saveAll = true;

		// User chooses whether to save only current language
		if (otherDirty) {
			saveAll = window.confirm(t("actions.saveAllLangs"));
		}

		await onSave({ saveAll, navigateAfter: !isEdit });
	};

	const hasOtherDirty = quizLanguages.some((l) => l.code !== currentLang && translations[l.code]?.is_dirty);


	const onChangeLang = (langCode) => {
		if (translation.is_dirty && !warnedLanguages.has(currentLang)) {
			if (!window.confirm(t("actions.switchAnyway"))) return;
			setWarnedLanguages((prev) => new Set(prev).add(currentLang));
		}
		if (translations[langCode]) setCurrentLang(langCode);
	};

	const onCreateTranslation = (langCode) => {
		setTranslations((prev) => ({ ...prev, [langCode]: { ...emptyDraft, is_dirty: true, has_translation: false } }));
		setCurrentLang(langCode);
	};

	const onToggleActive = (langCode) => setTranslations((prev) => ({ ...prev, [langCode]: { ...prev[langCode], is_active: !prev[langCode].is_active, is_dirty: true } }));

	const onDeleteLang = (langCode) => {
		const otherLangs = Object.keys(translations).filter((c) => c !== langCode);
		const otherHasData = otherLangs.some((c) => translations[c]?.has_translation || translations[c]?.title || (translations[c]?.questions?.length ?? 0) > 0);

		if (!otherHasData) {
			if (!window.confirm(t("actions.deleteLastLang"))) return;
			setTranslations({});
			setCurrentLang(null);
			window.location.href = "/";
			return;
		}

		setTranslations((prev) => {
			const updated = { ...prev };
			delete updated[langCode];
			return updated;
		});

		if (currentLang === langCode) setCurrentLang(otherLangs[0] || i18n.language);
	};


	return (
		<>
			<FaviconTitle title={t("pages.createPage")} iconHref={faviconUrl} />
			<Main>
				<UnsavedChangesGuard when={translation.is_dirty || hasOtherDirty} />
				<Header
					title={isEdit ? t("quiz.editTitle") : t("quiz.title")}
					icon={<FilePenLine size={19} />}
					goBack
					withBorder
					actions={[
						<Controls key="controls"><ToggleThemeSwitch /></Controls>,
						<Button
							variant="success"
							onClick={handleSave}
							style={{ width: "100%", minWidth: "var(--spacing-6xl)" }}
						><Save size={16} />{t("actions.save")}</Button>,
					]}
				/>
				<Body>
					{loaderVisible && (
						<LoadingWrapper $fadingOut={!showLoader}>
							<Loader2 className="spin" size={32} strokeWidth={2.5} />
						</LoadingWrapper>
					)}

					{/* Left Sidebar */}
					<>
						<LeftSidebar
							visible={leftSidebarVisible}
							onHide={() => setLeftSidebarVisible(false)}
							translation={translation}
							currentLang={currentLang}
							questionRefs={questionRefs}
							addSingleQuestion={addSingleQuestion}
							setTranslations={setTranslations}
						/>
						{!leftSidebarVisible && (
							<ShowLeftSidebarButton onClick={() => setLeftSidebarVisible(true)}>
								<BadgeQuestionMark size={24} color={"var(--color-text)"} />
							</ShowLeftSidebarButton>
						)}
					</>

					{/* Center Panel */}
					<CenterPanel
						currentLang={currentLang}
						leftSidebarVisible={leftSidebarVisible}
						rightSidebarVisible={rightSidebarVisible}
						quizExpanded={quizExpanded}
						quiz={quiz}
						setQuizExpanded={setQuizExpanded}
						questionsExpanded={questionsExpanded}
						setQuestionsExpanded={setQuestionsExpanded}
						modules={modules}
						tags={tags}
						translation={translation}
						updateQuizField={updateQuizField}
						updateTranslationField={updateTranslationField}
						addSingleQuestion={addSingleQuestion}
						moveQuestion={moveQuestion}
						questionRefs={questionRefs}
					/>

					{/* Right Sidebar */}
					<>
						<RightSidebar
							visible={rightSidebarVisible}
							onHide={() => setRightSidebarVisible(false)}
							langsStatus={quizLanguages.map((l) => {
								const d = translations[l.code] ?? {};
								return {
									...l,
									has_translation: d.has_translation || !!d.title || (d.questions?.length ?? 0) > 0,
									is_active: d.is_active,
									is_dirty: d.is_dirty,
								};
							})}
							currentLang={currentLang}
							onCreateTranslation={onCreateTranslation}
							onToggleActive={onToggleActive}
							onChangeLang={onChangeLang}
							onDeleteLang={onDeleteLang}
						/>
						{!rightSidebarVisible && (
							<ShowRightSidebarButton onClick={() => setRightSidebarVisible(true)}>
								<Languages size={24} color={"var(--color-text)"} />
							</ShowRightSidebarButton>
						)}
					</>
				</Body>
			</Main>
		</>
	);
}


const Main = styled.main`
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background-color: var(--color-background);
    overflow: hidden;
`;

const Controls = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
`;

const Body = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;
    height: 100%;
    position: relative;
`;

const ShowLeftSidebarButton = styled.div`
    position: absolute;
    top: var(--spacing-l);
    left: var(--spacing);
    z-index: 50;
    cursor: pointer;

    &:hover svg {
        transition: all 0.2s ease;
        stroke: var(--color-primary-bg);
    }
`;

const ShowRightSidebarButton = styled(ShowLeftSidebarButton)`
    left: auto;
    right: var(--spacing);
`;

const LoadingWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
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
