import api from "./axiosClient";
import i18n from "i18next";
import { getLangCode } from "./i18n_lang";
import { buildQuizFormData } from "../utils/form";

// ---------------------------------------------------------
//  GENERAL HELPERS
// ---------------------------------------------------------

/**
 * Ensures Laravel Sanctum CSRF cookie is set
 * Only required before POST/PUT/DELETE that need authentication.
 */
export async function ensureCsrf() {
	await api.get("/sanctum/csrf-cookie");
}

export async function getMe() {
	const res = await api.get("/api/me");
	return res.data;
}

// ---------------------------------------------------------
//  QUIZZES
// ---------------------------------------------------------

/**
 * Fetch list of quizzes, optionally filtered by language.
 * Ownership / visibility is decided server-side from the authenticated user.
 */
export async function getQuizzes({ lang = "en" } = {}) {
	const res = await api.get("/api/quizzes", {
		params: { lang: lang.toLowerCase() },
	});
	return res.data;
}

/**
 * Create or update a quiz using FormData
 * Laravel expects POST + `_method=PUT` for updates
 */
export async function saveQuiz(payload, quizId = null) {
	await ensureCsrf();

	const formData = buildQuizFormData(payload);

	formData.append(
		"questions_to_show",
		payload.questions_to_show == null ? "" : String(payload.questions_to_show)
	);

	if (quizId) formData.append("_method", "PUT");

	const url = quizId ? `/api/quizzes/${quizId}` : "/api/quizzes";

	const res = await api.post(url, formData);
	return res.data;
}

/**
 * Load quiz editor data with multiple languages
 */
export async function getQuizEditor({ id_quiz, langs = "en" } = {}) {
	const res = await api.get(`/api/quizzes/${id_quiz}/editor`, {
		params: { langs },
	});
	return res.data;
}

/**
 * Get single quiz in a given language
 */
export async function getQuiz(id, lang) {
	const res = await api.get(`/api/quizzes/${id}`, {
		params: { lang: lang || getLangCode() },
	});
	return res.data;
}

/**
 * Delete quiz by ID
 */
export async function deleteQuiz(id_quiz) {
	await ensureCsrf();
	const res = await api.delete(`/api/quizzes/${id_quiz}`);
	return res.data;
}

/**
 * Submit quiz answers / attempt
 * payload: { started_at, ended_at, time_taken, answers: [{question_id, answer_ids, answer_text}] }
 */
export async function startQuizAttempt(quizId, lang) {
	await ensureCsrf();
	const res = await api.post(`/api/quizzes/${quizId}/attempts/start`, { lang });
	return res.data;
}

export async function finishQuizAttempt(quizId, attemptId, payload) {
	await ensureCsrf();
	const normalized = normalizeFinishPayload(payload);
	const res = await api.post(`/api/quizzes/${quizId}/attempts/${attemptId}/finish`, normalized);
	return res.data;
}

/**
 * - answers items can be {question_id,...} or {id_question,...}
 * - ensures ended_at exists
 * - ensures arrays exist
 */
function normalizeFinishPayload(payload = {}) {
	const ended_at = payload.ended_at ?? new Date().toISOString();

	const time_taken =
		typeof payload.time_taken === "number"
			? payload.time_taken
			: Number(payload.time_taken ?? 0);

	const lang = payload.lang ?? "en";

	const answersRaw = Array.isArray(payload.answers) ? payload.answers : [];

	const answers = answersRaw.map((a) => {
		const id_question = Number(a.id_question ?? a.question_id);
		const answer_ids = Array.isArray(a.answer_ids)
			? a.answer_ids.map((x) => Number(x))
			: [];

		return {
			id_question,
			answer_ids,
			answer_text: a.answer_text ?? null,
		};
	});

	return { ended_at, time_taken, lang, answers };
}

// ---------------------------------------------------------
//  MODULES / TAGS
// ---------------------------------------------------------

/**
 * Fetch all modules with requested languages
 */
export async function getModules() {
	const langs = Object.keys(i18n.options.resources).map((c) => c.toLowerCase());

	const res = await api.get("/api/modules", {
		params: langs.length ? { langs: langs.join(",") } : {},
	});

	return res.data;
}

export async function updateModules(payload) {
	try {
		const res = await api.post("/api/modules/update", payload);
		return res.data;
	} catch (err) {
		console.error("Backend error full response:", err.response?.data || err.message);
		console.log(err);
		throw new Error(
			err.response?.data?.message ||
			err.response?.data?.error ||
			JSON.stringify(err.response?.data) ||
			err.message
		);
	}
}

/**
 * Fetch all tags with requested languages
 */
export async function getTags() {
	const langs = Object.keys(i18n.options.resources).map((c) => c.toLowerCase());

	const res = await api.get("/api/tags", {
		params: langs.length ? { langs: langs.join(",") } : {},
	});

	return res.data;
}

export async function updateTags(payload) {
	try {
		const res = await api.post("/api/tags/update", payload);
		return res.data;
	} catch (err) {
		console.error("Backend error full response:", err.response?.data || err.message);
		throw new Error(
			err.response?.data?.message ||
			err.response?.data?.error ||
			JSON.stringify(err.response?.data) ||
			err.message
		);
	}
}