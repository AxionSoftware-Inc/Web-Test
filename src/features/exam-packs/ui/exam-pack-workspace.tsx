"use client";

import { BarChart3, CheckCircle2, Download, FileJson, FileUp, Link2, Plus, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import type { ApiExamPack, ApiExamPackItem, ApiExamPackResults, ApiTest, StrictPackImportSource } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getPackManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, premiumInputClass } from "@/shared/ui/premium-shell";
import { StudentPackClient } from "./student-pack-client";

type PackImportQuestion = StrictPackImportSource["tests"][number]["questions"][number];
type PackImportTest = StrictPackImportSource["tests"][number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(source: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function readNumber(source: Record<string, unknown>, keys: string[], fallback: number) {
  for (const key of keys) {
    const value = source[key];
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[^\d.]/g, "")) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

function normalizeJsonTextareaBackslashes(text: string) {
  return text.replace(/\\+/g, (slashes) => slashes.length % 2 === 0 ? slashes : `${slashes}\\`);
}

function escapeLooseJsonBackslashes(text: string) {
  let output = "";
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] ?? "";
    if (!inString) {
      output += char;
      if (char === '"') inString = true;
      continue;
    }
    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }
    if (char === '"') {
      output += char;
      inString = false;
      continue;
    }
    if (char !== "\\") {
      output += char;
      continue;
    }
    const afterNext = text[index + 2] ?? "";
    const jsonEscape = next === '"' || next === "\\" || next === "/" || next === "n" || next === "r" || next === "t" || next === "b" || next === "f";
    const looksLikeLatexCommand = /[bfnrt]/.test(next) && /[A-Za-z]/.test(afterNext);
    const validUnicodeEscape = next === "u" && /^[0-9a-fA-F]{4}$/.test(text.slice(index + 2, index + 6));
    output += (jsonEscape && !looksLikeLatexCommand) || validUnicodeEscape ? char : "\\\\";
    if ((jsonEscape && !looksLikeLatexCommand) || validUnicodeEscape) escaped = true;
  }
  return output;
}

function parseJsonImport(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(jsonText) as unknown;
  } catch (error) {
    try {
      return JSON.parse(escapeLooseJsonBackslashes(jsonText)) as unknown;
    } catch {
      throw error;
    }
  }
}

function normalizeQuestion(raw: unknown, fallbackDifficulty: PackImportTest["difficulty"]): PackImportQuestion | null {
  if (!isRecord(raw)) return null;
  const options = Array.isArray(raw.options)
    ? raw.options.map((item, index) => isRecord(item)
      ? { id: readString(item, ["id", "key"], String.fromCharCode(65 + index)), text: readString(item, ["text", "label", "value", "body", "title"]) }
      : { id: String.fromCharCode(65 + index), text: String(item) }).filter((item) => item.text)
    : [];
  const answer = raw.answer ?? raw.javob;
  const correct = isRecord(answer) ? readString(answer, ["correct", "id", "value", "text"]) : readString(raw, ["correct", "correct_answer", "answer", "answer_key", "javob"], String(answer ?? ""));
  const body = readString(raw, ["body", "prompt", "question", "text", "savol", "matn"]);
  if (!body && !options.length && !correct) return null;
  return {
    type: readString(raw, ["type"], options.length ? "single_choice" : "short_answer") as PackImportQuestion["type"],
    body,
    options,
    answer: { correct },
    explanation: readString(raw, ["explanation", "solution", "commentary", "yechim", "izoh"]),
    skills: ["general"],
    difficulty: readString(raw, ["difficulty", "level"], fallbackDifficulty) as PackImportQuestion["difficulty"],
  };
}

function normalizeImportSource(raw: unknown, pack: ApiExamPack): StrictPackImportSource | null {
  if (!isRecord(raw) && !Array.isArray(raw)) return null;
  const record = isRecord(raw) ? raw : {};
  const packRecord = isRecord(record.pack) ? record.pack : record;
  const fallbackPack = {
    title: pack.title,
    subject: slugify(readString(packRecord, ["subject"], pack.exam_type || "math")),
    branch: slugify(readString(packRecord, ["branch", "topic", "category"], pack.exam_type || pack.title)),
    level: readString(packRecord, ["level", "difficulty"], "mixed"),
    language: readString(packRecord, ["language", "lang"], "uz"),
  };
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(record.tests)
      ? record.tests
      : Array.isArray(record.questions)
        ? record.questions
        : [];
  if (!rows.length) return null;
  const tests = rows
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const questionRows = Array.isArray(item.questions) || Array.isArray(item.test_questions) || Array.isArray(item.savollar)
        ? (item.questions ?? item.test_questions ?? item.savollar) as unknown[]
        : null;
      if (questionRows) {
        const difficulty = readString(item, ["difficulty", "level"], "beginner") as PackImportTest["difficulty"];
        const questions = questionRows.map((question) => normalizeQuestion(question, difficulty)).filter((question): question is PackImportQuestion => Boolean(question));
        return questions.length ? {
          title: readString(item, ["title", "name", "nom"], `${pack.title} ${index + 1}`),
          topic: readString(item, ["topic", "topic_slug", "category", "branch", "subject"], fallbackPack.branch),
          difficulty,
          time_limit_minutes: readNumber(item, ["time_limit_minutes", "estimated_minutes", "minutes"], 15),
          questions,
        } : null;
      }
      return null;
    })
    .filter((item): item is PackImportTest => Boolean(item));
  if (tests.length) return { version: "1.0", pack: fallbackPack, tests };
  const questions = rows.map((item) => normalizeQuestion(item, "beginner")).filter((item): item is PackImportQuestion => Boolean(item));
  return questions.length
    ? { version: "1.0", pack: fallbackPack, tests: [{ title: readString(record, ["title", "name"], pack.title), topic: fallbackPack.branch, difficulty: "beginner", time_limit_minutes: 15, questions }] }
    : null;
}

export function ExamPackWorkspace({ pack, initialItems, results, tests }: { pack: ApiExamPack; initialItems: ApiExamPackItem[]; results: ApiExamPackResults; tests: ApiTest[] }) {
  const [currentPack, setCurrentPack] = useState(pack);
  const [items, setItems] = useState(initialItems);
  const [packTitle, setPackTitle] = useState(pack.title);
  const [packDescription, setPackDescription] = useState(pack.description);
  const [packExamType, setPackExamType] = useState(pack.exam_type);
  const [packVisibility, setPackVisibility] = useState<ApiExamPack["visibility"]>(pack.visibility);
  const [packAccessCode, setPackAccessCode] = useState(pack.access_code);
  const [packPriceLabel, setPackPriceLabel] = useState(pack.price_label);
  const [testId, setTestId] = useState(tests[0]?.id ?? 0);
  const [title, setTitle] = useState(tests[0]?.title ?? "");
  const [order, setOrder] = useState(initialItems.length + 1);
  const [required, setRequired] = useState(true);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [jsonValue, setJsonValue] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const rows = results.results;
  const weakSkillRows = (results.weak_skills ?? []).map((skill) => ({
    label: skill.skill,
    value: skill.percent,
    meta: `${skill.total} questions`,
  }));
  const csv = useMemo(() => [
    "student,test,item,score,correct,total,submitted_at",
    ...rows.map((item) => [item.student_name, item.test_title, item.item_title, item.score, item.correct, item.total, item.submitted_at ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")),
  ].join("\n"), [rows]);
  const filtered = items.filter((item) => `${item.title} ${item.test_title} ${item.difficulty}`.toLowerCase().includes(query.toLowerCase()));
  const alreadyAdded = new Set(items.map((item) => item.test));
  const filteredTests = tests.filter((test) => `${test.title} ${test.slug} ${test.difficulty} ${test.topic_slug}`.toLowerCase().includes(testQuery.toLowerCase()));
  const exportTests = items
    .map((item) => tests.find((test) => test.id === item.test))
    .filter((test): test is ApiTest => Boolean(test))
    .map((test) => ({
      title: test.title,
      topic: test.topic_slug,
      difficulty: test.difficulty,
      time_limit_minutes: test.estimated_minutes,
      questions: test.test_questions.map((item) => ({
        type: item.question.type,
        body: item.question.prompt,
        options: item.question.options.map((text, index) => ({ id: String.fromCharCode(65 + index), text })),
        answer: { correct: item.question.answer },
        explanation: item.question.explanation,
        skills: item.question.skill_titles.length ? item.question.skill_titles : ["general"],
        difficulty: item.question.difficulty,
      })),
    }));

  function download(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    link.click();
    URL.revokeObjectURL(href);
  }

  async function copyPackLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/exam-packs/${currentPack.slug}`);
    setNotice("Pack link clipboardga olindi.");
  }

  async function savePack() {
    setBusy(true);
    setNotice("");
    try {
      const updated = await questApi.updateExamPack(currentPack.slug, {
        title: packTitle,
        description: packDescription,
        exam_type: packExamType,
        visibility: packVisibility,
        access_code: packVisibility === "private" ? packAccessCode : "",
        price_label: packPriceLabel,
        manage_code: getPackManageCode(currentPack.slug),
      });
      setCurrentPack(updated);
      setNotice("Pack ma'lumotlari saqlandi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Pack update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addItem() {
    if (!testId) return;
    setBusy(true);
    setNotice("");
    try {
      const created = await questApi.createExamPackItem(pack.slug, { test: testId, title, order, is_required: required, manage_code: getPackManageCode(pack.slug) });
      setItems((current) => [...current, created].sort((a, b) => a.order - b.order));
      setOrder((value) => value + 1);
      setNotice("Pack item qo'shildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Item create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addSelectedTests() {
    if (!selectedTestIds.length) return;
    setBusy(true);
    setNotice("");
    try {
      const body = selectedTestIds.map((id, index) => {
        const test = tests.find((item) => item.id === id);
        return { test: id, title: test?.title, order: items.length + index + 1, is_required: required };
      });
      const imported = await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: getPackManageCode(pack.slug), items: body });
      setItems((current) => [...current, ...imported.created].sort((a, b) => a.order - b.order));
      setSelectedTestIds([]);
      setOrder((value) => value + imported.created.length);
      setNotice(`${imported.created.length} ta test packga qo'shildi. ${imported.skipped.length} ta test o'tkazib yuborildi.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Bulk add failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(item: ApiExamPackItem) {
    setBusy(true);
    setNotice("");
    try {
      const updated = await questApi.updateExamPackItem(pack.slug, item.id, { is_required: !item.is_required, manage_code: getPackManageCode(pack.slug) });
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setNotice(updated.is_required ? "Item required qilindi." : "Item optional qilindi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Item update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: ApiExamPackItem) {
    setBusy(true);
    setNotice("");
    try {
      const deleted = await questApi.deleteExamPackItem(pack.slug, item.id, getPackManageCode(pack.slug));
      if (deleted) {
        setItems((current) => current.map((row) => (row.id === deleted.id ? deleted : row)));
        setNotice("Natijasi bor item optional qilindi.");
      } else {
        setItems((current) => current.filter((row) => row.id !== item.id));
        setNotice("Item o'chirildi.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Item delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const body = (lines[0]?.toLowerCase().includes("test_slug") ? lines.slice(1) : lines).map((line, index) => {
      const [testSlug, itemTitle, orderValue, requiredValue] = line.split(/[,;\t]/).map((value) => value.trim().replace(/^"|"$/g, ""));
      return { test_slug: testSlug, title: itemTitle, order: Number(orderValue || index + 1), is_required: requiredValue ? requiredValue.toLowerCase() !== "false" : true };
    }).filter((item) => item.test_slug);
    setBusy(true);
    setNotice("");
    try {
      const imported = await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: getPackManageCode(pack.slug), items: body });
      setItems((current) => [...current, ...imported.created].sort((a, b) => a.order - b.order));
      setNotice(`${imported.created.length} ta item import qilindi. ${imported.skipped.length} ta qator o'tkazib yuborildi.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function importJsonText(text: string, fileName?: string) {
    setBusy(true);
    setNotice("");
    try {
      const raw = parseJsonImport(normalizeJsonTextareaBackslashes(text)) as { items?: Array<{ test_slug?: string; title?: string; order?: number; is_required?: boolean; test?: number }> };
      const source = normalizeImportSource(raw, currentPack);
      if (source) {
        const imported = await questApi.importExamPackTests(pack.slug, { source, manage_code: getPackManageCode(pack.slug), manage_key: getPackManageCode(pack.slug) });
        setItems((current) => [...current, ...imported.created].sort((a, b) => a.order - b.order));
        setNotice(`${imported.created.length} ta yangi test ${fileName ? `${fileName} faylidan ` : ""}packga qo'shildi. ${imported.skipped.length} ta test o'tkazib yuborildi.`);
        setJsonValue("");
        return;
      }
      const body = Array.isArray(raw.items) ? raw.items : [];
      if (!body.length) {
        setNotice("[client_schema/items_empty] JSON ichida tests[].questions yoki items[].test_slug topilmadi.");
        return;
      }
      const imported = await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: getPackManageCode(pack.slug), items: body });
      setItems((current) => [...current, ...imported.created].sort((a, b) => a.order - b.order));
      setNotice(`${imported.created.length} ta mavjud test item sifatida import qilindi. ${imported.skipped.length} ta qator o'tkazib yuborildi.`);
      setJsonValue("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "JSON import failed.");
    } finally {
      setBusy(false);
      if (jsonRef.current) jsonRef.current.value = "";
    }
  }

  async function importJson(file: File) {
    const text = normalizeJsonTextareaBackslashes(await file.text());
    setJsonValue(text);
    await importJsonText(text, file.name);
  }

  return (
    <main className="min-h-screen bg-background py-6 text-ink">
      <div className="w-full">
        <header className="border-y border-black/8 bg-white">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="px-5 py-6 sm:px-6">
              <Eyebrow>Exam pack workspace</Eyebrow>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{currentPack.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-black/58">{currentPack.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={copyPackLink} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft"><Link2 className="size-4" />Copy link</button>
                <button onClick={() => download(`${currentPack.slug}-results.csv`, csv, "text/csv;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft"><Download className="size-4" />Export CSV</button>
                <button onClick={() => download(`${currentPack.slug}.json`, JSON.stringify({ version: "1.0", pack: currentPack, tests: exportTests, items, results }, null, 2), "application/json;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft"><FileJson className="size-4" />Export JSON</button>
                <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft"><Upload className="size-4" />Import CSV</button>
                <button onClick={() => jsonRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft"><FileJson className="size-4" />Import JSON</button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} />
                <input ref={jsonRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importJson(file); }} />
              </div>
              {notice ? <p className="mt-4 rounded-2xl bg-surface-soft px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
            </div>
            <div className="bg-ink px-5 py-6 text-white sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Pack health</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric icon={CheckCircle2} label="Tests" value={items.length} />
                <Metric icon={BarChart3} label="Attempts" value={results.attempts} />
                <Metric icon={CheckCircle2} label="Required" value={items.filter((item) => item.is_required).length} />
                <Metric icon={BarChart3} label="Average" value={`${results.average_score}%`} />
              </div>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 px-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="border-y border-black/8 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><Eyebrow>Pack builder</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Testlarni packga qo&apos;shish</h2></div>
              <Link href={`/exam-packs/${pack.slug}/add-test`} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">Advanced add</Link>
            </div>
            <div className="mt-5 grid gap-4 rounded-2xl border border-black/8 bg-surface-soft p-4 lg:grid-cols-[1fr_1fr_90px_auto_auto] lg:items-end">
              <FieldShell label="Backend test"><select value={testId} onChange={(event) => { const id = Number(event.target.value); setTestId(id); setTitle(tests.find((test) => test.id === id)?.title ?? title); }} className={premiumInputClass}>{tests.map((test) => <option key={test.id} value={test.id}>{test.title} / {test.difficulty}</option>)}</select></FieldShell>
              <FieldShell label="Item title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={premiumInputClass} /></FieldShell>
              <FieldShell label="Order"><input type="number" value={order} onChange={(event) => setOrder(Number(event.target.value))} className={premiumInputClass} /></FieldShell>
              <button type="button" onClick={() => setRequired((value) => !value)} className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", required ? "border-accent bg-brand-soft text-brand" : "border-black/10 bg-white text-black/55")}>{required ? "Required" : "Optional"}</button>
              <button onClick={addItem} disabled={busy || !testId} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" />Add</button>
            </div>
            <div className="mt-5 rounded-2xl border border-black/8 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Bulk select from tests</p>
                  <p className="mt-1 text-sm text-black/50">Bir nechta backend testni tanlab, bitta bosishda packga qo&apos;shing.</p>
                </div>
                <button onClick={addSelectedTests} disabled={busy || !selectedTestIds.length} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Add {selectedTestIds.length || ""}</button>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/8 bg-surface-soft px-4 py-3">
                <Search className="size-4 text-black/35" />
                <input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} placeholder="Test title, slug, topic..." className="w-full bg-transparent text-sm outline-none" />
              </div>
              <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                {filteredTests.map((test) => {
                  const selected = selectedTestIds.includes(test.id);
                  const disabled = alreadyAdded.has(test.id);
                  return (
                    <button
                      key={test.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedTestIds((current) => selected ? current.filter((id) => id !== test.id) : [...current, test.id])}
                      className={cn("rounded-2xl border p-4 text-left text-sm disabled:cursor-not-allowed disabled:opacity-45", selected ? "border-brand bg-brand-soft" : "border-black/8 bg-surface-soft hover:bg-white")}
                    >
                      <p className="font-semibold">{test.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/35">{disabled ? "Already in pack" : test.slug}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3"><Search className="size-4 text-black/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pack item qidirish..." className="w-full bg-transparent text-sm font-medium outline-none" /></div>
            <div className="mt-5 grid gap-3">
              {filtered.map((item) => (
                <article key={item.id} className="grid gap-4 rounded-2xl border border-black/8 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-black/52">{item.test_title} / {item.difficulty} / {item.question_count} questions</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void toggleItem(item)} disabled={busy} className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", item.is_required ? "border-accent text-brand" : "border-black/10 text-black/55")}>{item.is_required ? "Required" : "Optional"}</button>
                    <button onClick={() => void removeItem(item)} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl border border-red-100 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="size-4" />Remove</button>
                    <Link href={`/tests/${item.test_slug}`} className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-surface-soft">Open test</Link>
                  </div>
                </article>
              ))}
              {!filtered.length ? <div className="rounded-2xl border border-dashed border-black/12 bg-white p-8 text-center"><FileUp className="mx-auto size-9 text-black/28" /><p className="mt-3 font-semibold">Pack item yo&apos;q</p></div> : null}
            </div>
          </div>
          <aside className="grid gap-4">
            <section className="border-y border-black/8 bg-white p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Edit pack</h2>
              <div className="mt-4 grid gap-4">
                <FieldShell label="Title"><input value={packTitle} onChange={(event) => setPackTitle(event.target.value)} className={premiumInputClass} /></FieldShell>
                <FieldShell label="Exam type"><input value={packExamType} onChange={(event) => setPackExamType(event.target.value)} className={premiumInputClass} /></FieldShell>
                <FieldShell label="Price label"><input value={packPriceLabel} onChange={(event) => setPackPriceLabel(event.target.value)} className={premiumInputClass} /></FieldShell>
                <FieldShell label="Visibility">
                  <select value={packVisibility} onChange={(event) => setPackVisibility(event.target.value as ApiExamPack["visibility"])} className={premiumInputClass}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </FieldShell>
                {packVisibility === "private" ? <FieldShell label="Access code"><input value={packAccessCode} onChange={(event) => setPackAccessCode(event.target.value)} className={premiumInputClass} /></FieldShell> : null}
                <FieldShell label="Description"><textarea value={packDescription} onChange={(event) => setPackDescription(event.target.value)} rows={4} className={premiumInputClass} /></FieldShell>
                <button onClick={savePack} disabled={busy} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Save changes</button>
              </div>
            </section>
            <section className="border-y border-black/8 bg-white p-5 sm:p-6"><h2 className="text-2xl font-semibold">Weak skills</h2><div className="mt-4">{weakSkillRows.length ? <WeakTopicBars rows={weakSkillRows} /> : <p className="rounded-2xl bg-surface-soft p-5 text-sm text-muted">Natijalar bo&apos;lsa weak skilllar chiqadi.</p>}</div></section>
            <section className="border-y border-black/8 bg-white p-5 sm:p-6"><h2 className="text-2xl font-semibold">Pack qo&apos;shish usullari</h2><div className="mt-4 grid gap-3 text-sm text-black/58"><p><strong>Manual:</strong> bitta-bitta backend test tanlab qo&apos;shish.</p><p><strong>CSV:</strong> katta packni jadvaldan import qilish.</p><p><strong>JSON:</strong> boshqa akkaunt yoki backupdan pack itemlarni qayta yuklash.</p></div></section>
            <section className="border-y border-black/8 bg-white p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">JSON import</h2>
              <div className="mt-4 grid gap-3">
                <textarea
                  value={jsonValue}
                  onChange={(event) => setJsonValue(normalizeJsonTextareaBackslashes(event.target.value))}
                  rows={8}
                  className={premiumInputClass}
                  placeholder={'{ "tests": [{ "title": "Test title", "questions": [{ "body": "x^2", "options": ["A", "B"], "answer": "A" }] }] }'}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => jsonRef.current?.click()} disabled={busy} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50">Upload JSON</button>
                  <button onClick={() => void importJsonText(jsonValue)} disabled={busy || !jsonValue.trim()} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Add to pack</button>
                </div>
              </div>
            </section>
            <section className="border-y border-black/8 bg-white p-5 sm:p-6"><h2 className="text-2xl font-semibold">CSV format</h2><div className="mt-4 rounded-2xl bg-surface-soft p-4 font-mono text-xs leading-6 text-black/62">test_slug,title,order,is_required<br />algebra-basics,Algebra warmup,1,true</div><button onClick={() => download("pack-template.csv", "test_slug,title,order,is_required\nalgebra-basics,Algebra warmup,1,true\n", "text/csv;charset=utf-8")} className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">Download template</button></section>
          </aside>
        </section>

        <StudentPackClient pack={currentPack} items={items} />

        <section className="mt-4 border-y border-black/8 bg-white p-5 sm:p-6">
          <Eyebrow>Pack results</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Student progress</h2>
          <div className="mt-5 grid gap-3">
            {results.student_progress?.map((student) => <div key={student.student_code} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 md:grid-cols-[1fr_120px_120px_180px]"><p className="font-semibold">{student.student_name}</p><p>{student.completed}/{items.length} tests</p><span className="w-fit rounded-xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand">{student.average_score}%</span><p className="text-sm text-black/48">{student.last_submitted_at ? new Date(student.last_submitted_at).toLocaleString() : "No submit"}</p></div>)}
            {!results.student_progress?.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Hali pack natijalari yo&apos;q.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string | number }) {
  return <div className="rounded-2xl bg-white/8 p-4"><Icon className="size-4 text-accent" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}
