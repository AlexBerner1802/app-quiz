// src/services/api.js
import i18n from "i18next";
import { getLangCode } from "./i18n_lang";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

	if (payload.cover_image_file instanceof File || payload.cover_image_file instanceof Blob) {
		fd.append("cover_image_file", payload.cover_image_file);
	}

	if (payload.cover_image_url !== undefined && payload.cover_image_url !== null) {
		fd.append("cover_image_url", payload.cover_image_url);
	}

	if (payload.translations) {
		fd.append("translations", JSON.stringify(payload.translations));
	}

	return fd;
}


// QUIZZES
export async function getQuizzes({ onlyActive = false, lang = "en" } = {}) {
	const q = new URLSearchParams();

	if (onlyActive) q.set("only_active", "1");
	if (lang) q.set("lang", lang.toLowerCase());

	try {
		const res = await fetch(`${API_URL}/api/quizzes?${q.toString()}`);
		const data = await res.json();

		if (!res.ok) {
			console.error(data?.message);
		}

		return data;
	} catch (err) {
		console.error("Error fetching quizzes:", err);
		return { error: err.message };
	}
}

export async function saveQuiz(payload, quizId = null) {
	try {
		const formData = buildQuizFormData(payload);

		// If updating, Laravel expects PUT via POST + _method
		if (quizId) {
			formData.append("_method", "PUT");
		}

		await ensureCsrf();

		const res = await fetch(
			quizId ? `${API_URL}/api/quizzes/${quizId}` : `${API_URL}/api/quizzes`,
			{
				method: "POST",
				credentials: "include",
				headers: { Accept: "application/json" },
				body: formData,
			}
		);

		const data = await res.json();

		if (!res.ok) {
			console.error("Laravel error response:", data);
			throw new Error(data?.message || "Failed to save quiz");
		}

		return data;
	} catch (err) {
		console.error("Error saving quiz:", err);
		throw err;
	}
}

export async function getQuizEditor(id) {
	if (!id) throw new Error("Invalid quiz ID");

	const allowedLangs = Object.keys(i18n.options.resources)
		.map(c => c.toLowerCase())
		.join(',');

	const url = `${API_URL}/api/quizzes/${encodeURIComponent(id)}/editor?langs=${allowedLangs}`;
	const res = await fetch(url, {
		headers: { Accept: "application/json" },
		credentials: "omit",
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(errText || `HTTP ${res.status} ${res.statusText}`);
	}

	return res.json();
}

export async function getQuiz(id, lang) {
	const l = lang || getLangCode();
	const r = await fetch(`${API_URL}/api/quizzes/${id}?lang=${l}`);
	return toJsonResponse(r);
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
	const allowedLangs = Object.keys(i18n.options.resources).map(c => c.toLowerCase());
	const query = allowedLangs.length ? `?langs=${allowedLangs.join(',')}` : '';
	const res = await fetch(`${API_URL}/api/modules${query}`, {
		credentials: "omit",
		headers: { Accept: "application/json" },
	});
	const data = await res.json().catch(() => ([]));
	if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
	return data;
}

export async function getTags() {
	const allowedLangs = Object.keys(i18n.options.resources).map(c => c.toLowerCase());
	const queryParams = new URLSearchParams();
	if (allowedLangs.length) queryParams.append('langs', allowedLangs.join(','));

	const url = `${API_URL}/api/tags?${queryParams.toString()}`;
	const res = await fetch(url, {
		headers: { Accept: "application/json" },
		credentials: "omit",
	});
	const data = await res.json().catch(() => ([]));
	if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
	return data;
}

