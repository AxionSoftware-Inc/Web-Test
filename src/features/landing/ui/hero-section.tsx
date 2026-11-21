"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { useTranslation } from "@/shared/i18n/i18n-context";

export function HeroSection() {
  const { t, locale } = useTranslation();

  const labels = {
    uz: {
      badge: "Adaptiv diagnostika va baholash platformasi",
      exploreTests: "Testlar bazasi",
      subjects: "Akademik fanlar",
      createTest: "Yangi test",
    },
    ru: {
      badge: "Платформа адаптивной диагностики и оценки",
      exploreTests: "База тестов",
      subjects: "Академические дисциплины",
      createTest: "Создать тест",
    },
    en: {
      badge: "Adaptive Diagnostic & Assessment Platform",
      exploreTests: "Test Repository",
      subjects: "Academic Disciplines",
      createTest: "Create Test",
    },
  }[locale];

  return (
    <section id="home" className="relative isolate overflow-hidden border-b border-line bg-surface-soft">
      <div aria-hidden="true" className="landing-grid absolute inset-0 opacity-40 pointer-events-none" />
      <Container className="relative !max-w-[1200px] py-14 sm:py-18 lg:py-20">
        <div className="max-w-3xl text-left">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            {labels.badge}
          </p>
          <h1 className="mt-3.5 text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.14]">
            {t.landing.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-black/60 sm:text-base sm:leading-7">
            {t.landing.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-start gap-3">
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <span>{labels.exploreTests}</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/create-test"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
            >
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>{labels.createTest}</span>
            </Link>
            <Link
              href="#subjects"
              className="inline-flex items-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-black/20"
            >
              {labels.subjects}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
