"use client";

import { useEffect, useState, useCallback } from "react";
import { I18nextProvider } from "react-i18next";

import i18n, {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANG_STORAGE_KEY,
  getDirection,
  readStoredLanguage,
} from "./config";

function applyDocumentLang(lang) {
  if (typeof document === "undefined") return;
  const dir = getDirection(lang);
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.dataset.lang = lang;
}

export function I18nProvider({ children }) {
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored !== i18n.language) {
      i18n.changeLanguage(stored).finally(() => {
        applyDocumentLang(stored);
        setReady(true);
      });
    } else {
      applyDocumentLang(i18n.language || DEFAULT_LANGUAGE);
      setReady(true);
    }

    const onLangChange = (lng) => {
      applyDocumentLang(lng);
      try {
        if (SUPPORTED_LANGUAGES.includes(lng)) {
          window.localStorage.setItem(LANG_STORAGE_KEY, lng);
        }
      } catch {}
    };

    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, []);

  // We deliberately render children even before `ready` flips — i18next returns
  // keys synchronously once init has run on this module load, so there is no FOUC.
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
