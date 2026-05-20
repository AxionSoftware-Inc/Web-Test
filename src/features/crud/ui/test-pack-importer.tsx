"use client";

import { Download, FileJson, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { strictPackExample } from "@/features/crud/ui/test-pack-schema";
import type { StrictPackImportSource } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getCreatorCode, getPackManageCode, savePackManageCode } from "@/shared/model/local-identity";

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === "," || char === ";" || char === "\t") && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function csvToPack(text: string): StrictPackImportSource {
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headers = parseCsvLine(rows[0] ?? "").map((item) => item.toLowerCase());
  const tests = new Map<string, StrictPackImportSource["tests"][number]>();
  for (const row of rows.slice(1)) {
    const values = parseCsvLine(row);
    const data = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const title = data.test_title || data.title || "Imported Test";
    const test = tests.get(title) ?? {
      title,
      topic: data.topic || "general",
      difficulty: (data.difficulty || "easy") as StrictPackImportSource["tests"][number]["difficulty"],
      time_limit_minutes: Number(data.time_limit_minutes || 10),
      questions: [],
    };
    const options = ["A", "B", "C", "D", "E"].map((id) => ({ id, text: data[`option_${id.toLowerCase()}`] || data[`option_${id}`] || "" })).filter((item) => item.text);
    test.questions.push({
      type: (data.type || "single_choice") as StrictPackImportSource["tests"][number]["questions"][number]["type"],
      body: data.body || data.question || "",
      options,
      answer: { correct: data.answer || data.correct || "A" },
      explanation: data.explanation || "",
      skills: (data.skills || "general").split(/[|,]/).map((item) => item.trim()).filter(Boolean),
      difficulty: (data.question_difficulty || data.difficulty || "easy") as StrictPackImportSource["tests"][number]["questions"][number]["difficulty"],
    });
    tests.set(title, test);
  }
  return {
    version: "1.0",
    pack: {
      title: "CSV Imported Pack",
      subject: "math",
      branch: "imported",
      level: "foundations",
      language: "uz",
    },
    tests: Array.from(tests.values()),
  };
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
  URL.revokeObjectURL(href);
}

export function TestPackImporter() {
  const [source, setSource] = useState(strictPackExample);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseSource(value: string) {
    const trimmed = value.trim();
    if (/^test_title[,;\t]/i.test(trimmed) || /^title[,;\t]/i.test(trimmed)) return csvToPack(trimmed);
    return JSON.parse(extractJson(trimmed)) as StrictPackImportSource;
  }

  async function importPack() {
    setSaving(true);
    setNotice("");
    try {
      const parsed = parseSource(source);
      const creatorCode = getCreatorCode();
      const result = await questApi.importTestPack({
        source: parsed,
        creator_name: "Creator",
        creator_code: creatorCode,
        manage_key: creatorCode,
        pack_manage_code: getPackManageCode(),
      });
      savePackManageCode(result.pack.slug, result.pack.manage_code);
      setNotice(`${result.tests.length} ta test va pack saqlandi. ${result.skipped.length} ta test o'tkazib yuborildi.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Pack import failed.");
    } finally {
      setSaving(false);
    }
  }

  async function loadFile(file: File) {
    const text = await file.text();
    setSource(text);
    setNotice(`${file.name} dan matn olindi. Import qilishdan oldin tekshirib chiqing.`);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <section className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Add pack</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#151713]">Pack import</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
            Qat&apos;iy 1.0 schema bo&apos;yicha yirik JSON matn, JSON fayl yoki CSV import qiling. Fayldan matn olinadi, backend testlarni va packni DBga saqlaydi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
            <Upload className="size-4" />
            File
          </button>
          <button onClick={() => download("questlab-pack-schema.json", strictPackExample, "application/json;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
            <Download className="size-4" />
            Schema
          </button>
          <button onClick={importPack} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            <FileJson className="size-4" />
            {saving ? "Importing..." : "Import pack"}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".json,.csv,.txt,.md,application/json,text/csv,text/plain" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }} />
      <textarea value={source} onChange={(event) => setSource(event.target.value)} className="mt-6 min-h-[520px] w-full rounded-3xl border border-black/10 bg-[#fbfbf6] p-5 font-mono text-xs leading-6 outline-none" />
      {notice ? <p className="mt-4 rounded-2xl bg-[#edf7f3] px-4 py-3 text-sm font-semibold text-[#276a5b]">{notice}</p> : null}
      <div className="mt-5 rounded-3xl border border-black/8 bg-white p-4 text-sm leading-6 text-black/58">
        CSV uchun ustunlar: <span className="font-semibold">test_title, topic, difficulty, time_limit_minutes, type, body, option_A, option_B, option_C, option_D, answer, explanation, skills</span>.
        JSON fayldagi asosiy formatni <Link href="/crud/schema" className="font-semibold text-[#276a5b]">Schema</Link> sahifasida ham ko&apos;rish mumkin.
      </div>
    </section>
  );
}
