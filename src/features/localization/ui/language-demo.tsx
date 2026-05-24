"use client";

import { useState } from "react";

import { GlassCard } from "@/shared/ui/glass-card";

const dictionary = {
  uz: {
    title: "Faqat test emas — bilimdagi bo‘shliqni topadigan platforma.",
    cta: "Algebrani boshlash",
  },
  en: {
    title: "Not just tests — a platform that finds and fixes skill gaps.",
    cta: "Start Algebra",
  },
  ru: {
    title: "Не просто тесты — платформа, которая находит пробелы в знаниях.",
    cta: "Начать алгебру",
  },
};

export function LanguageDemo() {
  const [locale, setLocale] = useState<keyof typeof dictionary>("uz");

  return (
    <GlassCard className="mt-8 p-5">
      <div className="flex flex-wrap gap-2">
        {Object.keys(dictionary).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item as keyof typeof dictionary)}
            className={item === locale ? "rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white" : "rounded-xl bg-white/60 px-3 py-2 text-sm font-semibold"}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
      <h2 className="mt-5 text-2xl font-semibold">{dictionary[locale].title}</h2>
      <p className="mt-3 text-sm font-semibold text-brand">{dictionary[locale].cta}</p>
    </GlassCard>
  );
}
