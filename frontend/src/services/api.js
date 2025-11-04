// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const DEFAULT_LANG = import.meta.env.VITE_I18N_DEFAULT_LANG || "fr";

function stringifyErrors(errs) {
	if (!errs || typeof errs !== "object") return "";
	try {
		return Object.entries(errs)
		.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
		.join(" | ");
	} catch {
		return "";
	}
}

async function toJsonResponse(res) {
	const text = await res.text();
	let data;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = { raw: text };
	}

	if (!res.ok) {
		const extra = stringifyErrors(data?.errors);
		const msg = data?.error || data?.message || `HTTP ${res.status} ${res.statusText}`;		throw new Error(extra ? `${msg} — ${extra}` : msg);
	}
	return data;
}

// Calls sanctum's CSRF cookie before state-changing request
async function ensureCsrf() {
  	await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" });
}

function buildQuizFormData(payload = {}) {
	const fd = new FormData();

	// Lang 
	const lang = payload.lang || DEFAULT_LANG;
	fd.append("lang", String(lang));

	// Logical fields (saved in backend)
	if (payload.title != null) fd.append("title", String(payload.title));
	if (payload.quiz_description != null) fd.append("quiz_description", String(payload.quiz_description));
	if (payload.is_active != null) fd.append("is_active", payload.is_active ? "1" : "0");
	if (payload.cover_image_url) fd.append("cover_image_url", payload.cover_image_url);

	// File (cover image)
	if (payload.cover_image instanceof File || payload.cover_image instanceof Blob) {
		fd.append("cover_image", payload.cover_image);
	}

	// Associated tables
	(payload.module_ids ?? []).forEach(v => fd.append("module_ids[]", String(v)));
	(payload.tag_ids ?? []).forEach(v => fd.append("tag_ids[]", String(v)));
	(payload.new_tags ?? []).forEach(v => fd.append("new_tags[]", String(v)));

	// JSON questions (asked by the controller)
	if (Array.isArray(payload.questions)) {
		fd.append("questions", JSON.stringify(payload.questions));
	}

	return fd;
}

// QUIZZES

/**
 * Quiz list (per language)
 * @param {{lang?: string, onlyActive?: boolean}=} opts
 */
export async function getQuizzes(opts = {}) {
	const params = new URLSearchParams();

	if (opts.onlyActive) params.append("only_active", "1");
	if (opts.lang) params.append("lang", opts.lang);

	const qs = params.toString() ? `?${params.toString()}` : "";

	const res = await fetch(`${API_URL}/api/quizzes${qs}`, {
		credentials: "omit",
		headers: { Accept: "application/json" },
	});

	return toJsonResponse(res);
}

export async function getQuiz(id, lang = "en") {
	const res = await fetch(`${API_URL}/api/quizzes/${id}?lang=${lang}`, {
		credentials: "omit",
		headers: { Accept: "application/json" },
	});
	return toJsonResponse(res);
}

/**
 * Quiz details (per language)
 * @param {number|string} id
 * @param {{lang?: string}=} opts
 */
export async function getQuiz(id, opts = {}) {
	const lang = opts.lang || DEFAULT_LANG;
	const res = await fetch(`${API_URL}/api/quizzes/${id}?lang=${encodeURIComponent(lang)}`, {
		credentials: "omit",
		headers: { Accept: "application/json" },
	});
	return toJsonResponse(res);
}

// Quiz creation (in a language)
// Asked payload: { lang, title, quiz_description, is_active, cover_image_url?, cover_image?, questions?, module_ids?, tag_ids?, new_tags? }

export async function createQuiz(payload) {
	await ensureCsrf();
	const body = buildQuizFormData(payload);
	const res = await fetch(`${API_URL}/api/quizzes`, {
		method: "POST",
		credentials: "include",
		headers: { Accept: "application/json" },
		body,
	});
	return toJsonResponse(res);
}


// Quiz update (in a language)
// Asked payload: same as createQuiz

export async function updateQuiz(id, payload) {
	await ensureCsrf();
	const body = buildQuizFormData(payload);
	// Method override for Laravel when multipart
	body.append("_method", "PUT");
	const res = await fetch(`${API_URL}/api/quizzes/${id}`, {
		method: "POST",
		credentials: "include",
		headers: { Accept: "application/json" },
		body,
	});
	return toJsonResponse(res);
}

export async function deleteQuiz(id) {
	await ensureCsrf();
	const res = await fetch(`${API_URL}/api/quizzes/${id}`, {
		method: "DELETE",
		credentials: "include",
		headers: { Accept: "application/json" },
	});
	return toJsonResponse(res);
}


// MODULES / TAGS


export async function getModules() {
	const res = await fetch(`${API_URL}/api/modules`, {
		credentials: "omit",
		headers: { Accept: "application/json" },
	});
	return toJsonResponse(res);
}

export async function getTags(q) {
	const url = q ? `${API_URL}/api/tags?q=${encodeURIComponent(q)}` : `${API_URL}/api/tags`;
	const res = await fetch(url, { headers: { Accept: "application/json" }, credentials: "omit" });
	const data = await res.json().catch(() => ([]));
		if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
	return data;
}

export async function createTag(tag_name) {
	const res = await fetch(`${API_URL}/api/tags`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		credentials: "omit",
		body: JSON.stringify({ tag_name }),
	});
	const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
	return data;
}

export async function createQuizMulti(body, draftsByLang) {
	const hasFile = draftsByLang && Object.values(draftsByLang).some(d => d?.coverImageFile);
	if (hasFile) {
		const fd = new FormData();
		for (const d of Object.values(draftsByLang)) {
		if (d?.coverImageFile) { fd.append('cover_image', d.coverImageFile); break; }
		}
		fd.append('languages', JSON.stringify(body.languages));
		const r = await fetch(`${API_URL}/api/quizzes`, { method: 'POST', body: fd });
		return toJsonResponse(r);
	}
	const r = await fetch(`${API_URL}/api/quizzes`, {
		method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
	});
	return toJsonResponse(r);
}

export async function updateQuizMulti(id, body, draftsByLang) {
	const hasFile = draftsByLang && Object.values(draftsByLang).some(d => d?.coverImageFile);
	if (hasFile) {
		const fd = new FormData();
		for (const d of Object.values(draftsByLang)) {
		if (d?.coverImageFile) { fd.append('cover_image', d.coverImageFile); break; }
		}
		fd.append('languages', JSON.stringify(body.languages));
		const r = await fetch(`${API_URL}/api/quizzes/${id}`, { method: 'PUT', body: fd });
		return toJsonResponse(r);
	}
	const r = await fetch(`${API_URL}/api/quizzes/${id}`, {
		method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
	});
	return toJsonResponse(r);
}


export async function getQuizEditor(id) {
	const res = await fetch(`${API_URL}/api/quizzes/${id}/editor`, {
		credentials: "omit",
		headers: { Accept: "application/json" },
	});
	return toJsonResponse(res);
}

