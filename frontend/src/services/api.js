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

// ---------------------------------------------------------
//  QUIZZES
// ---------------------------------------------------------

/**
 * Fetch list of quizzes, optionally filtered by lang or active status
 */
export async function getQuizzes({ lang = "en", id_owner } = {}) {
	return api
		.get("/api/quizzes", {
			params: {
				lang: lang.toLowerCase(),
				id_owner,
			},
		})
		.then(res => res.data)
		.catch(err => ({ error: err.message }));
}

/**
 * Create or update a quiz using FormData
 * Laravel expects POST + `_method=PUT` for updates
 */
export async function saveQuiz(payload, quizId = null) {
	await ensureCsrf();
	const formData = buildQuizFormData(payload);

	if (quizId) formData.append("_method", "PUT");

	const url = quizId ? `/api/quizzes/${quizId}` : "/api/quizzes";

	const res = await api.post(url, formData);
	return res.data;
}

/**
 * Load quiz editor data with multiple languages
 */
export async function getQuizEditor(id) {
	if (!id) throw new Error("Invalid quiz ID");

	const langs = Object.keys(i18n.options.resources)
		.map((l) => l.toLowerCase())
		.join(",");

	const res = await api.get(`/api/quizzes/${id}/editor`, {
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
export async function deleteQuiz(id) {
	await ensureCsrf();
	const res = await api.delete(`/api/quizzes/${id}`);
	return res.data;
}

/**
 * Submit quiz answers / attempt
 * payload: { started_at, ended_at, time_taken, answers: [{question_id, answer_ids, answer_text}] }
 */
export async function startQuizAttempt(quizId, lang, userId) {
	await ensureCsrf();
	const res = await api.post(`/api/quizzes/${quizId}/attempts/start`, { lang, id_owner: userId });
	return res.data; // contains attempt_id
}

export async function finishQuizAttempt(quizId, attemptId, payload) {
	await ensureCsrf();
	const res = await api.post(`/api/quizzes/${quizId}/attempts/${attemptId}/finish`, payload);
	return res.data;
}


export async function submitQuizAttempt(quizId, payload) {
	await ensureCsrf();
	try {
		console.log(payload)
		const res = await api.post(`/api/quizzes/${quizId}/attempts`, payload);
		return res.data;
	} catch (err) {
		console.error("Failed to submit quiz attempt:", err.response?.data || err.message);
		throw new Error(err.response?.data?.message || "Failed to save quiz attempt");
	}
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
		console.log("Sending modules payload:", payload);
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
		console.log("Sending payload to backend:", payload);
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

