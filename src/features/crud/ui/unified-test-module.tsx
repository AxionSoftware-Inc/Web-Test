"use client";

import { ListPlus, ScrollText } from "lucide-react";
import Link from "next/link";

import type { ApiSkill, ApiSubject, ApiTest, ApiTopic } from "@/shared/api/questlab-api";
import { TestCrudForm } from "./test-crud-form";

export function UnifiedTestModule({ subjects, topics, tests, skills }: { subjects: ApiSubject[]; topics: ApiTopic[]; tests: ApiTest[]; skills: ApiSkill[] }) {
  return (
    <div>
      <header className="mb-6 rounded-[28px] border border-black/8 bg-white/82 p-4 shadow-[0_18px_55px_rgba(21,23,19,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-ink px-4 py-3 text-sm font-semibold text-white">
            <ListPlus className="size-4" />
            Add test
          </div>
          <Link href="/creator/add-pack" className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f3f3ec]">
            <ScrollText className="size-4" />
            Pack import
          </Link>
        </div>
      </header>
      <TestCrudForm subjects={subjects} topics={topics} tests={tests} skills={skills} />
    </div>
  );
}
