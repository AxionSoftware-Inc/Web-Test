"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Locale, locales, translations, type TranslationSchema } from "./translations";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationSchema;
  locales: typeof locales;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = "questlab-locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "uz";
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    return saved === "uz" || saved === "ru" || saved === "en" ? saved : "uz";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      window.dispatchEvent(new CustomEvent("questlab-locale-change", { detail: nextLocale }));
    } catch {
      // ignore localStorage errors
    }
  }

  const t = translations[locale] || translations.uz;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, locales }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
