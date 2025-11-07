// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const DEFAULT_LANG = import.meta.env.VITE_I18N_DEFAULT_LANG || "fr";
import { getLangCode } from "../services/i18n_lang";

function uniqNums(arr) {
  	return Array.from(new Set((arr || []).map(Number).filter(n => !Number.isNaN(n))));
}

function pickPrimaryLang(languages = []) {
  	return languages.find(l => Array.isArray(l.questions) && l.questions.length > 0) || languages[0];
}

function toBackendPayloadFromLanguages(languages = [], drafts = {}) {

	const filtered = (languages || []).filter(l => {
		const code = String(l.code || l.lang || "fr").toLowerCase();
		const d = drafts?.[code] || {};
		const hasText = (l.title?.trim?.() || d.title?.trim?.() || "").length > 0;
		const hasQs = Array.isArray(l.questions) ? l.questions.length > 0 : Array.isArray(d.questions) && d.questions.length > 0;
		const hasCover = !!(l.cover_image_url || d.coverImageUrl || d.coverImageFile);
		const hasMods = (l.module_ids?.length || d.selectedModuleIds?.length) > 0;
		const hasTags = (l.tag_ids?.length || d.selectedTagIds?.length) > 0;
		const active = !!(l.is_active ?? d.active);
		return hasText || hasQs || hasCover || hasMods || hasTags || active || d.hasTranslation;
  	});

	const translations = {};
	const is_active_by_lang = {};
	const questions_translations = {};

	let module_ids_union = [];
	let tag_ids_union = [];
	let new_tags_union = [];

	for (const l of filtered) {
		const code = String(l.code || l.lang || "fr").toLowerCase();
		const d = drafts?.[code] || {};
		translations[code] = {
			title: l.title ?? d.title ?? "",
			quiz_description: l.quiz_description ?? d.quiz_description ?? "",
			cover_image_url: (l.cover_image_url ?? d.coverImageUrl ?? "").trim() || undefined,
		};
		is_active_by_lang[code] = !!(l.is_active ?? d.active ?? true);

		const qLang = Array.isArray(l.questions) ? l.questions : (d.questions || []);
		questions_translations[code] = qLang.map(q => ({
			question_title: q.title ?? "",
			question_description: q.description ?? "",
			answers: Array.isArray(q.options) ? q.options.map(txt => txt ?? "") : [],
		}));

		module_ids_union = uniqNums(module_ids_union.concat(l.module_ids || d.selectedModuleIds || []));
		tag_ids_union    = uniqNums(tag_ids_union.concat(l.tag_ids    || d.selectedTagIds    || []));
		if (Array.isArray(l.new_tags)) {
		new_tags_union = Array.from(new Set(new_tags_union.concat(l.new_tags.filter(Boolean))));
		}
	}

	const primary = pickPrimaryLang(languages);
	const primaryQs = Array.isArray(primary?.questions) ? primary.questions
					: (drafts?.[String(primary?.code || "fr")]?.questions || []);
	const questions = primaryQs.map((q, idx) => ({
		id_type: Array.isArray(q.correctIndices) && q.correctIndices.length > 1 ? 2 : 1,
		order: typeof q.order === "number" ? q.order : (idx + 1),
		options: Array.isArray(q.options) ? q.options.map(x => x ?? "") : [],
		correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : [],
	}));

	const is_active = Object.values(is_active_by_lang).some(Boolean);

	return {
		translations,
		is_active_by_lang,
		is_active,
		questions,
		questions_translations,
		module_ids: module_ids_union,
		tag_ids: tag_ids_union,
		new_tags: new_tags_union,
	};
}

	function pickAnyCoverFile(drafts = {}) {
	for (const k of Object.keys(drafts || {})) {
		const f = drafts[k]?.coverImageFile;
		if (f instanceof File || f instanceof Blob) return f;
	}
	return null;
}

export function normalizeLanguages(langs = []) {
	const SUPPORTED = ["en", "fr", "de", "it"];

	return (langs || [])
		.map((l) => {
		if (!l) return null;

		const raw =
			l.code ?? l.lang ?? l.language ?? l.locale ?? l.i18n ??
			(typeof l.language_id === "string" ? l.language_id : null);

		const code = String(raw || "").toLowerCase().split("-")[0];

		return {
			...l,
			code: SUPPORTED.includes(code) ? code : getLangCode(),
			lang: undefined,
			language: undefined,
			locale: undefined,
			i18n: undefined,
			language_id: undefined,
			id_lang: undefined,
			id: l.id && typeof l.id === "number" ? undefined : l.id,
		};
		})
		.filter(Boolean);
}


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

	if (typeof payload.cover_image_url === "string" && payload.cover_image_url.trim() !== "") {
    	fd.append("cover_image_url", payload.cover_image_url.trim());
  	}

	// File (cover image)
	if (payload.cover_image instanceof File || payload.cover_image instanceof Blob) {
		fd.append("cover_image", payload.cover_image);
	}

	if (payload.translations && typeof payload.translations === "object") {
		fd.append("translations", JSON.stringify(payload.translations));
	}

	// Active by lang
	if (payload.is_active_by_lang && typeof payload.is_active_by_lang === "object") {
		fd.append("is_active_by_lang", JSON.stringify(payload.is_active_by_lang));
	}

	// JSON questions (asked by the controller)
	if (Array.isArray(payload.questions)) {
		fd.append("questions", JSON.stringify(payload.questions));
	}

	// Questions i18n
	if (payload.questions_translations && typeof payload.questions_translations === "object") {
		fd.append("questions_translations", JSON.stringify(payload.questions_translations));
	}

	// Associated tables
	if (Array.isArray(payload.module_ids)) {
		fd.append("module_ids", JSON.stringify(payload.module_ids.map(Number)));
	}
	if (Array.isArray(payload.tag_ids)) {
		fd.append("tag_ids", JSON.stringify(payload.tag_ids.map(Number)));
	}
	if (Array.isArray(payload.new_tags)) {
		fd.append("new_tags", JSON.stringify(payload.new_tags));
	} else if (typeof payload.new_tags === "string") {
		fd.append("new_tags", JSON.stringify(
		payload.new_tags.split(",").map(s => s.trim()).filter(Boolean)
		));
	}
	
	return fd;
}

// QUIZZES

export async function getQuizzes({ onlyActive = true, lang } = {}) {
	const l = lang || getLangCode();
	const q = new URLSearchParams();
	if (onlyActive) q.set("only_active", "1");
	q.set("lang", l);
	const r = await fetch(`${API_URL}/api/quizzes?${q.toString()}`);
	return toJsonResponse(r);
}


export async function getQuiz(id, lang) {
	const l = lang || getLangCode();
	const r = await fetch(`${API_URL}/api/quizzes/${id}?lang=${l}`);
	return toJsonResponse(r);
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

export async function createQuizMulti(body, drafts = {}) {
	const normalized = toBackendPayloadFromLanguages(body.languages || [], drafts);

	const coverFile = pickAnyCoverFile(drafts);
	if (coverFile) {
		const fd = buildQuizFormData({
		...normalized,
		cover_image: coverFile,
		
		});
		await ensureCsrf();
		const r = await fetch(`${API_URL}/api/quizzes`, {
		method: "POST",
		credentials: "include",
		headers: { Accept: "application/json" },
		body: fd,
		});
		return toJsonResponse(r);
	} else {
		await ensureCsrf();
		const r = await fetch(`${API_URL}/api/quizzes`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify(normalized),
		});
		return toJsonResponse(r);
	}
}

export async function updateQuizMulti(id, body, drafts = {}) {
	const normalized = toBackendPayloadFromLanguages(body.languages || [], drafts);

	const coverFile = pickAnyCoverFile(drafts);
	if (coverFile) {
		const fd = buildQuizFormData({
			...normalized,
			cover_image: coverFile,
		});

		fd.append("_method", "PUT");
		await ensureCsrf();
		const r = await fetch(`${API_URL}/api/quizzes/${id}`, {
			method: "POST",
			credentials: "include",
			headers: { Accept: "application/json" },
			body: fd,
		});
		return toJsonResponse(r);
	} else {
		await ensureCsrf();
		const r = await fetch(`${API_URL}/api/quizzes/${id}`, {
			method: "PUT",
			credentials: "include",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify(normalized),
		});
		return toJsonResponse(r);
	}
}


export async function getQuizEditor(id, lang) {
	const l = lang || getLangCode();
	const r = await fetch(`${API_URL}/api/quizzes/${id}/editor?lang=${l}`);
	return toJsonResponse(r);
}
