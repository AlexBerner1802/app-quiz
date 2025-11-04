import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/translation.json";
import frCommon from "./locales/fr/translation.json";
import deCommon from "./locales/de/translation.json";
import itCommon from "./locales/it/translation.json";

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: { common: enCommon },
			fr: { common: frCommon },
			de: { common: deCommon},
			it: { common: itCommon}
		},
		fallbackLng: "fr",
		supportedLngs: ["fr", "de", "en", "it"],
		load: "languageOnly",
		nonExplicitSupportedLngs: true,
		ns: ["common"],
		defaultNS: "common",
		detection: { order: ["localStorage", "querystring", "navigator"],
			caches: ["localStorage"],
			lookupQuerystring: "lng" },
		interpolation: { escapeValue: false },
		react: { useSuspense: false },
		initImmediate: false,
		returnNull: false
	});


export default i18n;

