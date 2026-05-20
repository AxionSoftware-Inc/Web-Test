"use client";

import { FileJson, ListPlus, ScrollText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ApiSkill, ApiSubject, ApiTest, ApiTopic } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { TestCrudForm } from "./test-crud-form";
import { TestPackImporter } from "./test-pack-importer";

type Mode = "test" | "pack";

export function UnifiedTestModule({ subjects, topics, tests, skills }: { subjects: ApiSubject[]; topics: ApiTopic[]; tests: ApiTest[]; skills: ApiSkill[] }) {
  const [mode, setMode] = useState<Mode>("test");

  return (
    <div>
      <header className="mb-6 rounded-[28px] border border-black/8 bg-white/82 p-4 shadow-[0_18px_55px_rgba(21,23,19,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-2xl border border-black/8 bg-[#fbfbf6] p-1">
            <ModeButton active={mode === "test"} icon={ListPlus} label="Add test" onClick={() => setMode("test")} />
            <ModeButton active={mode === "pack"} icon={FileJson} label="Add pack" onClick={() => setMode("pack")} />
          </div>
          <Link href="/crud/schema" className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f3f3ec]">
            <ScrollText className="size-4" />
            Pack schema
          </Link>
        </div>
      </header>
      {mode === "test" ? <TestCrudForm subjects={subjects} topics={topics} tests={tests} skills={skills} /> : <TestPackImporter />}
    </div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof ListPlus; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
        active ? "bg-[#151713] text-white" : "text-black/58 hover:bg-white",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
