import i18n from "../i18n";

const SUPPORTED = ["en", "fr", "de", "it"];

export function getLangCode() {
	const raw = i18n.resolvedLanguage || i18n.language || "en";
	const code = String(raw).toLowerCase().split("-")[0];
	return SUPPORTED.includes(code) ? code : "en";
}