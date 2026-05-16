"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { doc, updateDoc } from "firebase/firestore";

import { firestore } from "./firebase";
import { useAuth } from "./useAuth";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_META,
  getDirection,
} from "./i18n/config";

/**
 * useLanguage — central hook for language state.
 *
 * Returns the current language, a setter that persists to localStorage and (if
 * a user is signed in) to the Firestore users/{uid}.language field, plus the
 * derived direction and `t` from react-i18next for convenience.
 */
export function useLanguage() {
  const { t, i18n } = useTranslation();
  const { user, userData } = useAuth();

  const [lang, setLangState] = useState(i18n.language || "en");

  useEffect(() => {
    const handler = (lng) => setLangState(lng);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [i18n]);

  // Adopt the user's saved preference once auth resolves, if it differs.
  useEffect(() => {
    const saved = userData?.language;
    if (saved && SUPPORTED_LANGUAGES.includes(saved) && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [userData?.language, i18n]);

  const setLanguage = useCallback(
    async (next) => {
      if (!SUPPORTED_LANGUAGES.includes(next)) return;
      await i18n.changeLanguage(next);
      // Best-effort sync to Firestore — silent on failure.
      if (user?.uid) {
        try {
          await updateDoc(doc(firestore, "users", user.uid), { language: next });
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[useLanguage] Firestore sync failed:", err?.message);
          }
        }
      }
    },
    [i18n, user?.uid]
  );

  const dir = getDirection(lang);

  return {
    t,
    lang,
    setLanguage,
    dir,
    isRTL: dir === "rtl",
    languages: SUPPORTED_LANGUAGES.map((code) => LANGUAGE_META[code]),
    meta: LANGUAGE_META[lang],
  };
}

export default useLanguage;
