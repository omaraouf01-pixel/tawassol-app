"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ar from "./locales/ar.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = ["en", "ar", "fr"];
export const RTL_LANGUAGES = ["ar"];
export const DEFAULT_LANGUAGE = "en";
export const LANG_STORAGE_KEY = "twassel-language";

export const LANGUAGE_META = {
  en: { code: "en", label: "English",  nativeLabel: "English",  flag: "🇬🇧", dir: "ltr" },
  ar: { code: "ar", label: "Arabic",   nativeLabel: "العربية",  flag: "🇸🇦", dir: "rtl" },
  fr: { code: "fr", label: "French",   nativeLabel: "Français", flag: "🇫🇷", dir: "ltr" },
};

export function getDirection(lang) {
  return RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
}

export function readStoredLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
    const nav = (window.navigator?.language || "").slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(nav)) return nav;
  } catch {}
  return DEFAULT_LANGUAGE;
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
        fr: { translation: fr },
      },
      lng: typeof window === "undefined" ? DEFAULT_LANGUAGE : readStoredLanguage(),
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;
