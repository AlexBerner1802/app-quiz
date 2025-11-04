// QuizEditor/_index.jsx

import React, { useMemo, useRef, useState, useEffect } from "react";
import { FilePenLine, Settings, Logs, Loader2} from "lucide-react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import UnsavedChangesGuard from "../../components/UnsavedChangesGuard";
import Header from "../../components/layout/Header";
import { createQuizMulti, getQuizEditor, updateQuizMulti, getModules, getTags } from "../../services/api";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import LeftSidebar from "./LeftSidebar";
import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";
import RightSidebar from "./RightSidebar";
import CenterPanel from "./CenterPanel";

export default function NewQuiz() {

	const { t, i18n } = useTranslation();
	const { id: quizId } = useParams();
	const isEdit = !!quizId;

	const [showLoader, setShowLoader] = useState(true);
	const [loaderVisible, setLoaderVisible] = useState(true);
	const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
	const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
	const [quizExpanded, setQuizExpanded] = useState(true);
	const [questionsExpanded, setQuestionsExpanded] = useState(true);

	const [modules, setModules] = useState([]);
	const [tags, setTags] = useState([]);
	const [warnedLanguages, setWarnedLanguages] = useState(new Set());

	// Language management
	const LANGS = Object.keys(i18n.options.resources).map((code) => ({
		code,
		label: t(`lang.${code}`, code),
		flag: ""
	}));

	const [currentLang, setCurrentLang] = useState(i18n.language || LANGS[0].code);
	const [drafts, setDrafts] = useState(() =>
		LANGS.reduce((acc, l) => {
			acc[l.code] = {
				title: "",
				quiz_description: "",
				questions: [],
				active: false,
				coverImageFile: null,
				coverImageUrl: "",
				selectedModuleIds: [],
				selectedTags: [],
				selectedTagIds: [],
				isDirty: false,
				hasTranslation: false,
			};
			return acc;
		}, {})
	);

	const questionRefs = useRef({});



	// Load modules, tags, and quiz data
	useEffect(() => {
		let alive = true;
		let timer;
		const init = async () => {
			try {
				const [mods, tagsData] = await Promise.all([getModules(), getTags()]);
				if (!alive) return;
				setModules(mods || []);
				setTags(tagsData || []);

				if (isEdit) {
					const quizData = await getQuizEditor(quizId);
					if (!alive) return;

					// Load per-language drafts from quizData.translations
					const newDrafts = { ...drafts };
					LANGS.forEach((l) => {
						const translation = quizData.translations?.find((t) => t.lang === l.code) || {};
						const mappedQs = (translation.questions || []).map((qq) => {
							const answers = Array.isArray(qq.answers) ? qq.answers : [];
							const options   = answers.map((a) => a.answer_text ?? "");
							const answerIds = answers.map((a) => a.id ?? a.id_answer ?? null);
							const correctIndices = answers
								.map((a, i) => (a.is_correct ? i : -1))
								.filter((i) => i >= 0);
							return {
								id: `q_${qq.id ?? Math.random()}`,
								backendId: qq.id ?? qq.id_question ?? null,
								title: qq.question_titre || "",
								description: qq.question_description || "",
								options,
								answerIds,
								correctIndices,
							};
						});
						newDrafts[l.code] = {
							title: translation.title || "",
							quiz_description: translation.quiz_description || "",
							questions: mappedQs,
							active: translation.is_active ?? true,
							coverImageFile: null,
							coverImageUrl: translation.cover_image_url || "",
							selectedModuleIds: quizData.modules?.map((m) => m.id) || [],
							selectedTags: quizData.tags || [],
							selectedTagIds: quizData.tags?.map((t) => t.id) || [],
							isDirty: false,
							hasTranslation: !!translation.id,
						};
					});
					setDrafts(newDrafts);
				}
			} catch (e) {
				console.error(e);
				alert(e.message || "Erreur de chargement");
			}
		};

		init().then(() => {
			if (!alive) return;
			setShowLoader(false);
			timer = setTimeout(() => setLoaderVisible(false), 400);
		});

		return () => {
			alive = false;
			if (timer) clearTimeout(timer);
		};
	}, [isEdit, quizId]);

	// Get current language draft
	const draft = drafts[currentLang] || { isDirty: false, questions: [] };

	const updateDraft = (updater) => {
		setDrafts(prev => {
			const prevDraft = prev[currentLang] || {};
			const nextDraft = typeof updater === "function" ? updater(prevDraft) : { ...prevDraft, ...updater };

			return {
				...prev,
				[currentLang]: {
					...prevDraft,
					...nextDraft,
					questions: Array.isArray(nextDraft.questions) ? nextDraft.questions : prevDraft.questions,
					isDirty: true,
				}
			};
		});
	};


	const addSingleQuestion = () => {
		const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		const q = {
			id,
			title: "",
			description: "",
			showDescription: false,
			options: ["", "", ""],
			correctIndices: [],
		};
		updateDraft(prevDraft => ({
			questions: [...(prevDraft.questions || []), q]
		}));
	};


	const moveQuestion = (index, direction) => {
		const newQs = [...draft.questions];
		if (direction === "up" && index > 0)
			[newQs[index - 1], newQs[index]] = [newQs[index], newQs[index - 1]];
		else if (direction === "down" && index < newQs.length - 1)
			[newQs[index], newQs[index + 1]] = [newQs[index + 1], newQs[index]];
		updateDraft({ questions: newQs });
	};

	const buildMultiPayload = () => {
		const langs = LANGS
			.filter(l => drafts[l.code])
			.map(l => {
				const d = drafts[l.code];
				return {
					code: l.code,
					is_active: !!d.active,
					title: d.title || "",
					quiz_description: d.quiz_description || "",
					module_ids: d.selectedModuleIds || [],
					tag_ids: d.selectedTagIds || [],
					questions: (d.questions || []).map((q, index) => ({
						id_question: q.backendId ?? undefined,
						tr_set_id: q.trSetId ?? undefined,
						title: q.title || "",
						description: q.description || "",
						order: typeof q.order === 'number' ? q.order : index,
						correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : [],
						options: (q.options || []).map((txt) => txt ?? ""),
						answerIds: (q.answerIds || undefined),
					})),
				};
			});
		return { languages: langs };
	};

	  const onSave = async ({ navigateAfter = false } = {}) => {
		try {
			const payload = buildMultiPayload();
				console.log('[QUIZ PAYLOAD]', {
				modulesByLang: payload.languages.map(l => ({ code: l.code, module_ids: l.module_ids })),
				tagsByLang: payload.languages.map(l => ({ code: l.code, tag_ids: l.tag_ids })),
			});

		    let res;
		    if (isEdit) {
				res = await updateQuizMulti(quizId, payload, drafts);
			} else {
				res = await createQuizMulti(payload, drafts);
			}


			if (res?.data?.mapping) {
				const map = res.data.mapping;
				const newQuizId = map.quiz_id ?? quizId;
				const qIdByIndex = {};
				const aIdByIndex = {};
				(map.questions || []).forEach(qm => {
					qIdByIndex[qm.index] = { id: qm.id_question, tr: qm.tr_set_id };
					aIdByIndex[qm.index] = {};
					(qm.answers || []).forEach(am => {
						aIdByIndex[qm.index][am.index] = { id: am.id_answer, tr: am.tr_set_id };
					});
				});

				setDrafts(prev => {
					const next = { ...prev };
					LANGS.forEach(l => {
						if (!next[l.code]) return;
						next[l.code] = {
							...next[l.code],
							isDirty: false,
							hasTranslation: true,
							questions: (next[l.code].questions || []).map((q, idxQ) => {
								const qMap = qIdByIndex[idxQ];
								const answerIds = (q.options || []).map((_, idxA) => aIdByIndex[idxQ]?.[idxA]?.id ?? (q.answerIds?.[idxA] ?? null));
								return {
									...q,
									backendId: q.backendId ?? qMap?.id ?? null,
									trSetId: q.trSetId ?? qMap?.tr ?? undefined,
									answerIds,
								};
							}),
						};
					});
					return next;
				});

				if (!isEdit && newQuizId && !quizId) {
					navigate(`/editor/${newQuizId}`);
				}
			} else {
				setDrafts(prev => {
					const next = { ...prev };
					LANGS.forEach(l => {
						if (!next[l.code]) return;
						next[l.code] = { ...next[l.code], isDirty: false, hasTranslation: true };
					});
					return next;
				});
			}
			alert("Saved successfully");

			if (!isEdit && navigateAfter) window.location.href = "/";

		} catch (e) {
			console.error(e);
			alert(e.message || "Error while saving");
		}
	};

	const onChangeLang = (langCode) => {
		if (draft.isDirty && !warnedLanguages.has(currentLang)) {
			if (!window.confirm("You have unsaved changes in this language. Switch anyway?")) return;
			setWarnedLanguages((prev) => new Set(prev).add(currentLang));
		}
		setCurrentLang(langCode);
	};

	const onSaveClick = async () => {
		const otherDirty = LANGS.some(l => l.code !== currentLang && drafts[l.code].isDirty);
		
		if (otherDirty) {
			const go = window.confirm("Sauvegarder toutes les langues en une fois ?");
			if (!go) return;
		}
		await onSave({ navigateAfter: !isEdit });
	};

	const onDeleteLang = (langCode) => {
		const otherLangs = Object.entries(drafts).filter(([code, d]) => code !== langCode && d);

		const otherLangsHaveData = otherLangs.some(
			([, d]) =>
				d && (d.hasTranslation || (d.title?.trim() || "") || (d.questions?.length ?? 0) > 0)
		);

		if (!otherLangsHaveData) {
			// Last language: warn first
			const confirmed = window.confirm(
				"This is the only language. Deleting it will erase the quiz completely and return you to home. Continue?"
			);
			if (!confirmed) return; // user cancelled

			// User confirmed: clear drafts and redirect
			setDrafts({});
			setCurrentLang(null);
			setTimeout(() => {
				window.location.href = "/";
			}, 0);
			return;
		}


		// normal deletion
		setDrafts((prev) => {
			const updated = { ...prev };
			delete updated[langCode];
			return updated;
		});

		if (currentLang === langCode) {
			const fallback = Object.keys(drafts).find((c) => c !== langCode) || i18n.language;
			if (fallback) setCurrentLang(fallback);
		}
	};


	const onCreateTranslation = (langCode) => {
		setCurrentLang(langCode);
		setDrafts((prev) => ({
			...prev,
			[langCode]: {
				...prev[langCode],
				title: "",
				quiz_description: "",
				questions: [],
				active: false,
				coverImageFile: null,
				coverImageUrl: "",
				isDirty: true,
				hasTranslation: false,
			},
		}));
	};

	const onToggleActive = (langCode) => {
		setDrafts((prev) => ({
			...prev,
			[langCode]: { ...prev[langCode], active: !prev[langCode].active, isDirty: true },
		}));
	};

	const hasOtherDirty = LANGS.some(
		(l) => l.code !== currentLang && drafts[l.code]?.isDirty
	);

	return (
		<>
			<FaviconTitle title={t("pages.createPage")} iconHref={faviconUrl} />

			<Main>

				<UnsavedChangesGuard when={draft.isDirty || hasOtherDirty} />

				<Header
					title={isEdit ? t("quiz.editTitle") || "Éditer le quiz" : t("quiz.title")}
					icon={<FilePenLine size={20} />}
					goBack
					withBorder
					actions={[
						<Controls key="controls">
							<ToggleThemeSwitch />
						</Controls>,
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
							drafts={drafts}
							currentLang={currentLang}
							questionRefs={questionRefs}
							addSingleQuestion={addSingleQuestion}
							setDrafts={setDrafts}
						/>

						{!leftSidebarVisible && (
							<ShowLeftSidebarButton onClick={() => setLeftSidebarVisible(true)}>
								<Logs size={24} color={"var(--color-text)"} />
							</ShowLeftSidebarButton>
						)}
					</>

					{/* Center panel */}
					<CenterPanel
						leftSidebarVisible={leftSidebarVisible}
						rightSidebarVisible={rightSidebarVisible}
						quizExpanded={quizExpanded}
						setQuizExpanded={setQuizExpanded}
						questionsExpanded={questionsExpanded}
						setQuestionsExpanded={setQuestionsExpanded}
						modules={modules}
						draft={draft}
						updateDraft={updateDraft}
						addSingleQuestion={addSingleQuestion}
						moveQuestion={moveQuestion}
						questionRefs={questionRefs}
					/>

					{/* Right Sidebar */}
					<>
						<RightSidebar
							visible={rightSidebarVisible}
							onHide={() => setRightSidebarVisible(false)}
							langsStatus={LANGS.map(l => {
								const draft = drafts[l.code];
								const hasTranslation =
									draft?.hasTranslation || !!draft?.title || (draft?.questions?.length ?? 0) > 0;
								return {
									...l,
									hasTranslation,
									isActive: draft?.active,
									isDirty: draft?.isDirty,
								};
							})}
							currentLang={currentLang}
							onCreateTranslation={onCreateTranslation}
							onToggleActive={onToggleActive}
							onChangeLang={onChangeLang}
							onSaveClick={onSaveClick}
							onDeleteLang={onDeleteLang}
						/>

						{!rightSidebarVisible && (
							<ShowRightSidebarButton onClick={() => setRightSidebarVisible(true)}>
								<Settings size={24} color={"var(--color-text)"} />
							</ShowRightSidebarButton>
						)}
					</>

				</Body>
			</Main>
		</>
	);
}


/* Styled Components */
const Main = styled.main`
    flex:1;
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
    gap:12px;
    flex-wrap:wrap;
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
	
	&:hover {
        svg {
            transition: all .2s ease;
            stroke: var(--color-primary-bg);
        }
	}
`;

const ShowRightSidebarButton = styled(ShowLeftSidebarButton)`
    position: absolute;
    top: var(--spacing-l);
	right: var(--spacing);
	left: auto;
    z-index: 50;
    cursor: pointer;

    &:hover {
        svg {
            transition: all .2s ease;
            stroke: var(--color-primary-bg);
        }
    }
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
