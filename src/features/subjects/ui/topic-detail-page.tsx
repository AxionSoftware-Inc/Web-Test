"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, HelpCircle, Layers, Play, Sparkles } from "lucide-react";

import type { ApiLevel, ApiTest } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";

interface TopicDetailPageProps {
  subjectSlug: string;
  subjectTitle?: string;
  topicSlug: string;
  topicTitle: string;
  levels: ApiLevel[];
}

const difficultyMap: Record<string, { label: string; color: string }> = {
  beginner: { label: "Boshlang'ich", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  intermediate: { label: "O'rta", color: "bg-blue-50 text-blue-700 border-blue-200" },
  advanced: { label: "Murakkab", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

export function TopicDetailPage({
  subjectSlug,
  subjectTitle = "Fanlar",
  topicSlug,
  topicTitle,
  levels,
}: TopicDetailPageProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const allTests: ApiTest[] = levels.flatMap((level) => level.tests);
  const primaryTest = allTests[0];

  // Unique skills across all tests
  const uniqueSkills = Array.from(
    new Set(
      allTests.flatMap((test) =>
        test.test_questions.flatMap((tq) => tq.question.skill_titles || []),
      ),
    ),
  );

  const filteredTests =
    selectedDifficulty === "all"
      ? allTests
      : allTests.filter((test) => test.difficulty.toLowerCase() === selectedDifficulty);

  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-6 sm:py-10">
        {/* Breadcrumb / Back link */}
        <div className="mb-6">
          <Link
            href={`/subjects/${subjectSlug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink/50 hover:text-brand transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>{subjectTitle} bo&apos;limlariga qaytish</span>
          </Link>
        </div>

        {/* Header summary */}
        <div className="flex flex-col gap-4 rounded-3xl border border-black/8 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <Layers className="size-3.5" />
              <span>Mavzular to&apos;plami</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {topicTitle}
            </h1>
            <p className="mt-1 text-sm text-ink/55">
              Jami {allTests.length} ta test · {levels.length} ta murakkablik darajasi
            </p>
          </div>

          {primaryTest ? (
            <div className="shrink-0">
              <Link
                href={`/tests/${primaryTest.slug}/start`}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand transition-all"
              >
                <Play className="size-4 fill-white" />
                <span>Testni boshlash</span>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Column: Filter Tabs + Test list */}
          <div>
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-black/8 pb-4">
              <button
                type="button"
                onClick={() => setSelectedDifficulty("all")}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  selectedDifficulty === "all"
                    ? "bg-ink text-white shadow-sm"
                    : "bg-white text-ink/65 hover:bg-black/5 border border-black/8"
                }`}
              >
                Barchasi ({allTests.length})
              </button>
              {levels.map((level) => {
                const diffKey = level.difficulty.toLowerCase();
                const count = level.tests.length;
                const isSelected = selectedDifficulty === diffKey;

                return (
                  <button
                    key={level.difficulty}
                    type="button"
                    onClick={() => setSelectedDifficulty(diffKey)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-ink text-white shadow-sm"
                        : "bg-white text-ink/65 hover:bg-black/5 border border-black/8"
                    }`}
                  >
                    {level.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Test Cards List */}
            <div className="mt-4 grid gap-3">
              {filteredTests.map((test) => {
                const diff = difficultyMap[test.difficulty.toLowerCase()] ?? {
                  label: test.difficulty,
                  color: "bg-gray-50 text-gray-700 border-gray-200",
                };

                return (
                  <div
                    key={test.id}
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-black/8 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:border-black/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold ${diff.color}`}
                        >
                          {diff.label}
                        </span>
                        <span className="text-xs text-ink/40">
                          O&apos;tish bali: {test.passing_score}%
                        </span>
                      </div>
                      <Link
                        href={`/tests/${test.slug}`}
                        className="mt-2 block text-base font-semibold text-ink group-hover:text-brand transition-colors"
                      >
                        {test.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink/50">
                        <span className="inline-flex items-center gap-1.5">
                          <HelpCircle className="size-3.5" />
                          <span>{test.test_questions.length} ta savol</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          <span>{test.estimated_minutes} daqiqa</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/tests/${test.slug}/start`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand"
                      >
                        <Play className="size-3.5 fill-white" />
                        <span>Boshlash</span>
                      </Link>
                      <Link
                        href={`/tests/${test.slug}`}
                        className="rounded-xl border border-black/10 px-3.5 py-2.5 text-xs font-semibold text-ink/75 hover:bg-black/5 transition"
                      >
                        Tafsilot
                      </Link>
                    </div>
                  </div>
                );
              })}

              {!filteredTests.length ? (
                <div className="rounded-2xl border border-dashed border-black/12 bg-white p-8 text-center text-sm text-ink/50">
                  Ushbu darajada hozircha testlar mavjud emas.
                </div>
              ) : null}
            </div>
          </div>

          {/* Sidebar Info */}
          <aside className="flex flex-col gap-5">
            {/* Skills Overview */}
            {uniqueSkills.length > 0 ? (
              <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/40">
                  <Sparkles className="size-4 text-brand" />
                  <span>Qamrab olingan mavzular</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {uniqueSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink/75"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quick Helper Info */}
            <div className="rounded-2xl border border-black/8 bg-[#fbfcf7] p-5 text-xs leading-relaxed text-ink/60">
              <p className="font-semibold text-ink mb-1">Qanday ishlaydi?</p>
              Har bir test sizning bilim darajangizni aniqlashga yordam beradi. Natijalar avtomatik ravishda tahlil qilinadi va zaif mavzular bo&apos;yicha tavsiyalar beriladi.
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
