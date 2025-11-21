// QuizEditor/_index.jsx

import React, { useRef, useState, useEffect } from "react";
import { FilePenLine, Settings, BadgeQuestionMark, Loader2 } from "lucide-react";
import {useNavigate, useParams} from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

// Components
import Header from "../../components/layout/Header";
import UnsavedChangesGuard from "../../components/UnsavedChangesGuard";
import FaviconTitle from "../../components/layout/Icon.jsx";
import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CenterPanel from "./CenterPanel";

// Services
import {
  createQuizMulti,
  getQuizEditor,
  updateQuizMulti,
  getModules,
  getTags,
} from "../../services/api";

// Assets
import faviconUrl from "../../assets/images/favicon.ico?url";

export default function NewQuiz() {
	const { t, i18n } = useTranslation();
	const { id: quizId } = useParams();
	const navigate = useNavigate();
	const isEdit = !!quizId;

	// UI state
	const [showLoader, setShowLoader] = useState(true);
	const [loaderVisible, setLoaderVisible] = useState(true);
	const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
	const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
	const [quizExpanded, setQuizExpanded] = useState(true);
	const [questionsExpanded, setQuestionsExpanded] = useState(true);

	// Data state
	const [modules, setModules] = useState([]);
	const [tags, setTags] = useState([]);
	const [warnedLanguages, setWarnedLanguages] = useState(new Set());

	// Language management
	const LANGS = Object.keys(i18n.options.resources).map((code) => ({
		code,
		label: t(`lang.${code}`, code),
		flag: "",
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

			const newDrafts = {};
			const existingLangs = quizData.translations?.map((t) => t.lang) ?? [];

			existingLangs.forEach((langCode) => {
				const translation =
				quizData.translations.find((t) => t.lang === langCode) || {};

				const mappedQs = (translation.questions || []).map((qq) => {
				const answers = Array.isArray(qq.answers) ? qq.answers : [];
				const options = answers.map((a) => a.answer_text ?? "");
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

				newDrafts[langCode] = {
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
				hasTranslation: true,
				};
			});

			const tempDrafts = { ...newDrafts };

			// Ensure all languages exist in drafts (even if empty)
			LANGS.forEach((l) => {
				if (!tempDrafts[l.code]) {
				tempDrafts[l.code] = {
					isNew: true,
					isDirty: false,
					hasTranslation: false,
					title: "",
					quiz_description: "",
					questions: [],
					active: false,
					selectedModuleIds: quizData.modules?.map((m) => m.id) || [],
					selectedTagIds: quizData.tags?.map((t) => t.id) || [],
					selectedTags: quizData.tags || [],
					coverImageFile: null,
					coverImageUrl: "",
				};
				}
			});

			setDrafts(tempDrafts);
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

	// Current language draft & derived values
	const draft = drafts[currentLang] ?? { isDirty: false, questions: [] };
	const visibleLangs = LANGS.filter((l) => !drafts[l.code]?.isNew);

	useEffect(() => {
		if (drafts[currentLang]?.isNew) {
			const fallback = visibleLangs[0]?.code;
		if (fallback && fallback !== currentLang) {
			setCurrentLang(fallback);
		}
		}
	}, [currentLang, drafts, visibleLangs]);

	// Helpers: draft manipulation
	const updateDraft = (updater) => {
		setDrafts((prev) => {
		const prevDraft = prev[currentLang] || {};
		const nextDraft =
			typeof updater === "function" ? updater(prevDraft) : { ...prevDraft, ...updater };

		return {
			...prev,
			[currentLang]: {
			...prevDraft,
			...nextDraft,
			questions: Array.isArray(nextDraft.questions)
				? nextDraft.questions
				: prevDraft.questions,
			isDirty: true,
			},
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
		updateDraft((prevDraft) => ({
		questions: [...(prevDraft.questions || []), q],
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

	// Payload builders & save handlers
	const buildMultiPayload = () => {
		const isMeaningful = (d) => {
		if (!d) return false;
			const hasText = (d.title?.trim() || "").length > 0;
			const hasQs = Array.isArray(d.questions) && d.questions.length > 0;
			const hasCover = !!d.coverImageFile || (d.coverImageUrl && d.coverImageUrl.trim() !== "");
			const hasMods = Array.isArray(d.selectedModuleIds) && d.selectedModuleIds.length > 0;
			const hasTags = Array.isArray(d.selectedTagIds) && d.selectedTagIds.length > 0;
		return d.hasTranslation || hasText || hasQs || hasCover || hasMods || hasTags || !!d.active;
		};

		const languages = LANGS.filter((l) => isMeaningful(drafts[l.code])).map((l) => {
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
				order: typeof q.order === "number" ? q.order : index,
				correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : [],
				options: (q.options || []).map((txt) => txt ?? ""),
				answerIds: q.answerIds || undefined,
				})),
			};
		});

		return { languages };
	};

	const onSave = async ({ navigateAfter = false } = {}) => {
		try {
		const payload = buildMultiPayload();

		console.log("[QUIZ PAYLOAD]", {
			modulesByLang: payload.languages.map((l) => ({ code: l.code, module_ids: l.module_ids })),
			tagsByLang: payload.languages.map((l) => ({ code: l.code, tag_ids: l.tag_ids })),
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

			(map.questions || []).forEach((qm) => {
			qIdByIndex[qm.index] = { id: qm.id_question, tr: qm.tr_set_id };
			aIdByIndex[qm.index] = {};
			(qm.answers || []).forEach((am) => {
				aIdByIndex[qm.index][am.index] = { id: am.id_answer, tr: am.tr_set_id };
			});
			});

			setDrafts((prev) => {
			const next = { ...prev };
			LANGS.forEach((l) => {
				if (!next[l.code]) return;
				next[l.code] = {
					...next[l.code],
					isDirty: false,
					hasTranslation: true,
					questions: (next[l.code].questions || []).map((q, idxQ) => {
						const qMap = qIdByIndex[idxQ];
						const answerIds = (q.options || []).map(
						(_, idxA) => aIdByIndex[idxQ]?.[idxA]?.id ?? q.answerIds?.[idxA] ?? null
						);
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
				// NOTE: navigate is intentionally left as-is to preserve original behavior/context
				navigate(`/editor/${newQuizId}/edit`);
			}
		} else {
			setDrafts((prev) => {
			const next = { ...prev };
			LANGS.forEach((l) => {
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

	// UI actions
	const onChangeLang = (langCode) => {
		if (draft.isDirty && !warnedLanguages.has(currentLang)) {
			if (!window.confirm(t("actions.switchAnyway"))) return;
			setWarnedLanguages((prev) => new Set(prev).add(currentLang));
			}
		if (!drafts[langCode]?.isNew) {
			setCurrentLang(langCode);
		}
	};

	const onSaveClick = async () => {
		const otherDirty = LANGS.some((l) => l.code !== currentLang && drafts[l.code]?.isDirty);
		if (otherDirty) {
			const go = window.confirm(t("actions.saveAllLangs"));
			if (!go) return;
		}
		await onSave({ navigateAfter: !isEdit });
	};

	const onDeleteLang = (langCode) => {
		const otherLangs = Object.entries(drafts).filter(([code]) => code !== langCode);

		const otherLangsHaveData = otherLangs.some(([, d]) => d && (d.hasTranslation || (d.title?.trim() || "") || (d.questions?.length ?? 0) > 0));

		if (!otherLangsHaveData) {
		const confirmed = window.confirm(t("actions.deleteLastLang"));
		if (!confirmed) return;

		setDrafts({});
		setCurrentLang(null);
		setTimeout(() => {
			window.location.href = "/";
		}, 0);
		return;
		}

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
			isNew: false,
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

  const hasOtherDirty = LANGS.some((l) => l.code !== currentLang && drafts[l.code]?.isDirty);

  return (
    <>
      <FaviconTitle title={t("pages.createPage")} iconHref={faviconUrl} />

      <Main>
        <UnsavedChangesGuard when={draft.isDirty || hasOtherDirty} />

        <Header
          title={isEdit ? t("quiz.editTitle") : t("quiz.title")}
          icon={<FilePenLine size={19} />}
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
                <BadgeQuestionMark size={24} color={"var(--color-text)"} />
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
              langsStatus={
                LANGS.map((l) => {
                  const d = drafts[l.code] ?? {};
                  const hasTranslation = d?.hasTranslation || !!d?.title || (d?.questions?.length ?? 0) > 0;
                  return {
                    ...l,
                    hasTranslation,
                    isActive: d?.active,
                    isDirty: d?.isDirty,
                  };
                })
              }
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

	&:hover {
		svg {
		transition: all 0.2s ease;
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
		transition: all 0.2s ease;
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
