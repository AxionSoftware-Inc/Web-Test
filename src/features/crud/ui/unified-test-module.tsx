"use client";

import { ListPlus, ScrollText, Sparkles } from "lucide-react";
import Link from "next/link";

import type { ApiSkill, ApiSubject, ApiTest, ApiTopic } from "@/shared/api/questlab-api";
import { OpenTestStudio } from "./open-test-studio";
import { TestCrudForm } from "./test-crud-form";

export function UnifiedTestModule({
  subjects,
  topics,
  tests,
  skills,
  advanced = false,
}: {
  subjects: ApiSubject[];
  topics: ApiTopic[];
  tests: ApiTest[];
  skills: ApiSkill[];
  advanced?: boolean;
}) {
  return (
    <div>
      <header className="mb-6 rounded-[28px] border border-black/8 bg-white/82 p-4 shadow-[0_18px_55px_rgba(21,23,19,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            <Sparkles className="size-4 text-amber-300" />
            <span>Ochiq Test Studiyasi</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={advanced ? "/crud" : "/crud?mode=advanced"}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-[#f3f3ec]"
            >
              <ListPlus className="size-3.5" />
              {advanced ? "Oson rejimga qaytish" : "Kengaytirilgan shakl"}
            </Link>
            <Link
              href="/creator/add-pack"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-[#f3f3ec]"
            >
              <ScrollText className="size-3.5" />
              Ko&apos;p testli baza
            </Link>
          </div>
        </div>
      </header>

      {advanced ? (
        <TestCrudForm subjects={subjects} topics={topics} tests={tests} skills={skills} />
      ) : (
        <OpenTestStudio />
      )}
    </div>
  );
}
