"use client";

import { Check, Clipboard, Download, FileJson, FileSpreadsheet, Layers3, Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { ApiExamPack, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getPackManageCode, savePackManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, PremiumPanel, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

type DraftItem = {
  test?: number;
  test_slug?: string;
  title?: string;
  order?: number;
  is_required?: boolean;
};

const templateCsv = "test_slug,title,order,is_required\nalgebra-basics,Algebra warmup,1,true\nquadratics-basics,Quadratics drill,2,true\n";

function parseCsv(text: string): DraftItem[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasHeader = lines[0]?.toLowerCase().includes("test_slug") || lines[0]?.toLowerCase().includes("slug");
  return (hasHeader ? lines.slice(1) : lines).map((line, index) => {
    const [testSlug, itemTitle, orderValue, requiredValue] = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return {
      test_slug: testSlug,
      title: itemTitle || testSlug,
      order: Number(orderValue || index + 1),
      is_required: requiredValue ? requiredValue.toLowerCase() !== "false" : true,
    };
  }).filter((item) => item.test_slug);
}

function parseLines(text: string): DraftItem[] {
  return text.split(/\r?\n/).map((line, index) => {
    const [slug, itemTitle] = line.split(/[,;\t]/).map((value) => value.trim());
    return { test_slug: slug, title: itemTitle || slug, order: index + 1, is_required: true };
  }).filter((item) => item.test_slug);
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

type PackUsage = { attempts: number; students_submitted: number; average_score: number };

export function ExamPacksClient({ initialPacks, tests, usageBySlug = {} }: { initialPacks: ApiExamPack[]; tests: ApiTest[]; usageBySlug?: Record<string, PackUsage> }) {
  const [packs, setPacks] = useState(initialPacks);
  const [title, setTitle] = useState("DTM Algebra Pack");
  const [examType, setExamType] = useState("DTM Math");
  const [description, setDescription] = useState("Algebra bo'yicha tayyor testlar to'plami.");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [accessCode, setAccessCode] = useState("2026");
  const [priceLabel, setPriceLabel] = useState("99 000 so'm");
  const [mode, setMode] = useState<"manual" | "select" | "csv" | "paste" | "json">("select");
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [pasteValue, setPasteValue] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const filteredTests = useMemo(() => {
    const value = testQuery.toLowerCase();
    return tests.filter((test) => `${test.title} ${test.slug} ${test.difficulty} ${test.topic_slug}`.toLowerCase().includes(value));
  }, [testQuery, tests]);

  const selectedItems = useMemo<DraftItem[]>(() => selectedTestIds.map((id, index) => {
    const test = tests.find((item) => item.id === id);
    return { test: id, title: test?.title, order: index + 1, is_required: true };
  }), [selectedTestIds, tests]);

  const itemsToCreate = mode === "select" ? selectedItems : draftItems;

  async function createPack() {
    setSaving(true);
    setError("");
    try {
      const pack = await questApi.createExamPack({
        title,
        slug: `${slugify(title)}-${Date.now().toString().slice(-4)}`,
        description,
        exam_type: examType,
        visibility,
        access_code: visibility === "private" ? accessCode : "",
        manage_code: getPackManageCode(),
        price_label: priceLabel,
        is_active: true,
      });
      savePackManageCode(pack.slug, pack.manage_code);
      if (itemsToCreate.length) {
        await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: pack.manage_code, items: itemsToCreate });
      }
      setPacks((items) => [pack, ...items]);
      setDraftItems([]);
      setSelectedTestIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exam pack create failed.");
    } finally {
      setSaving(false);
    }
  }

  async function importPack(file: File) {
    setSaving(true);
    setError("");
    try {
      const parsed = JSON.parse(await file.text()) as {
        pack?: Partial<ApiExamPack>;
        items?: Array<{ test_slug?: string; title?: string; order?: number; is_required?: boolean }>;
      };
      const importedPack = parsed.pack ?? {};
      const manageCode = getPackManageCode();
      const pack = await questApi.createExamPack({
        title: importedPack.title || title,
        slug: `${slugify(importedPack.slug || importedPack.title || title)}-${Date.now().toString().slice(-4)}`,
        description: importedPack.description || description,
        exam_type: importedPack.exam_type || examType,
        visibility: importedPack.visibility || visibility,
        access_code: importedPack.visibility === "private" ? importedPack.access_code || accessCode : "",
        manage_code: manageCode,
        price_label: importedPack.price_label || priceLabel,
        is_active: importedPack.is_active ?? true,
      });
      savePackManageCode(pack.slug, pack.manage_code);
      if (parsed.items?.length) {
        await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: manageCode, items: parsed.items });
      }
      setPacks((items) => [pack, ...items]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack import failed.");
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function importCsv(file: File) {
    setError("");
    try {
      const items = parseCsv(await file.text());
      setDraftItems(items);
      setMode("csv");
      setError(items.length ? "" : "CSV ichida test_slug topilmadi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed.");
    } finally {
      if (csvRef.current) csvRef.current.value = "";
    }
  }

  function applyPaste() {
    const value = pasteValue.trim();
    if (!value) return;
    try {
      const parsed = value.startsWith("{") || value.startsWith("[")
        ? JSON.parse(value) as { items?: DraftItem[] } | DraftItem[]
        : parseLines(value);
      const items = Array.isArray(parsed) ? parsed : parsed.items ?? [];
      setDraftItems(items);
      setMode(value.startsWith("{") || value.startsWith("[") ? "json" : "paste");
      setError(items.length ? "" : "Paste ichida item topilmadi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paste parse failed.");
    }
  }

  function toggleTest(testId: number) {
    setSelectedTestIds((current) => current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <PremiumPanel>
        <Eyebrow>Exam pack</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold">Create pack</h1>
        <div className="mt-5 grid gap-3">
          <button onClick={() => fileRef.current?.click()} disabled={saving} className="flex items-start gap-3 rounded-3xl border border-black/8 bg-white p-4 text-left hover:bg-[#fbfbf8] disabled:opacity-50">
            <Upload className="mt-1 size-5 text-[#276a5b]" />
            <span><span className="block font-semibold">Import JSON file</span><span className="mt-1 block text-sm text-black/52">Pack metadata va items JSONdan olinadi.</span></span>
          </button>
          <button onClick={() => csvRef.current?.click()} disabled={saving} className="flex items-start gap-3 rounded-3xl border border-black/8 bg-white p-4 text-left hover:bg-[#fbfbf8] disabled:opacity-50">
            <FileSpreadsheet className="mt-1 size-5 text-[#276a5b]" />
            <span><span className="block font-semibold">Import CSV items</span><span className="mt-1 block text-sm text-black/52">test_slug,title,order,is_required formatida.</span></span>
          </button>
          <Link href="/crud" className="flex items-start gap-3 rounded-3xl border border-black/8 bg-white p-4 text-left hover:bg-[#fbfbf8]">
            <Plus className="mt-1 size-5 text-[#276a5b]" />
            <span><span className="block font-semibold">Manual add test</span><span className="mt-1 block text-sm text-black/52">Bitta testni qo‘lda savollar bilan kiritish.</span></span>
          </Link>
        </div>
        <div className="mt-6 grid gap-4">
          <Input label="Pack title" value={title} onChange={setTitle} />
          <Input label="Exam type" value={examType} onChange={setExamType} />
          <Input label="Price label" value={priceLabel} onChange={setPriceLabel} />
          <FieldShell label="Visibility">
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")} className={premiumInputClass}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </FieldShell>
          {visibility === "private" ? <Input label="Access code" value={accessCode} onChange={setAccessCode} /> : null}
          <FieldShell label="Description">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={premiumInputClass} />
          </FieldShell>
          <button onClick={createPack} disabled={saving} className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Creating..." : itemsToCreate.length ? `Create with ${itemsToCreate.length} tests` : "Create empty pack"}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importPack(file); }} />
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} />
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </PremiumPanel>

      <PremiumPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Eyebrow>Pack builder</Eyebrow>
            <h2 className="mt-2 text-2xl font-semibold">Qo&apos;shish usullari</h2>
          </div>
          <button onClick={() => download("exam-pack-template.csv", templateCsv, "text/csv;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf8]">
            <Download className="size-4" />
            Template
          </button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          <ModeButton active={mode === "select"} icon={Layers3} label="Select" onClick={() => setMode("select")} />
          <ModeButton active={mode === "manual"} icon={Plus} label="Empty" onClick={() => setMode("manual")} />
          <ModeButton active={mode === "csv"} icon={FileSpreadsheet} label="CSV" onClick={() => setMode("csv")} />
          <ModeButton active={mode === "paste"} icon={Clipboard} label="Paste" onClick={() => setMode("paste")} />
          <ModeButton active={mode === "json"} icon={FileJson} label="JSON" onClick={() => setMode("json")} />
        </div>

        {mode === "select" ? (
          <section className="mt-5 rounded-3xl border border-black/8 bg-[#fbfbf6] p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3">
              <Search className="size-4 text-black/35" />
              <input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} placeholder="Test title, slug, topic..." className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="mt-4 grid max-h-[430px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {filteredTests.map((test) => {
                const active = selectedTestIds.includes(test.id);
                return (
                  <button key={test.id} type="button" onClick={() => toggleTest(test.id)} className={cn("rounded-2xl border bg-white p-4 text-left hover:bg-[#f4f2ea]", active ? "border-[#276a5b] ring-2 ring-[#8fd6bd]/40" : "border-black/8")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{test.title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/35">{test.slug}</p>
                      </div>
                      {active ? <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#edf7f3] text-[#276a5b]"><Check className="size-4" /></span> : null}
                    </div>
                    <p className="mt-3 text-sm text-black/52">{test.difficulty} / {test.test_questions.length} questions / {test.estimated_minutes} min</p>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {mode === "csv" || mode === "paste" || mode === "json" ? (
          <section className="mt-5 rounded-3xl border border-black/8 bg-[#fbfbf6] p-4">
            <FieldShell label={mode === "json" ? "JSON items yoki { items: [...] }" : "Paste slugs, CSV rows yoki spreadsheetdan copy"}>
              <textarea value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} rows={8} className={premiumInputClass} placeholder={mode === "json" ? "{\"items\":[{\"test_slug\":\"algebra-basics\",\"title\":\"Algebra warmup\"}]}" : "algebra-basics,Algebra warmup\nquadratics-basics,Quadratics drill"} />
            </FieldShell>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={applyPaste} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white">Use pasted items</button>
              <button onClick={() => csvRef.current?.click()} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">Upload CSV</button>
            </div>
          </section>
        ) : null}

        {itemsToCreate.length ? (
          <section className="mt-5 rounded-3xl border border-black/8 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Draft items</p>
              <button onClick={() => { setDraftItems([]); setSelectedTestIds([]); }} className="text-sm font-semibold text-black/45 hover:text-black">Clear</button>
            </div>
            <div className="mt-3 grid gap-2">
              {itemsToCreate.slice(0, 8).map((item, index) => (
                <div key={`${item.test ?? item.test_slug}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbfbf6] px-4 py-3 text-sm">
                  <span className="font-semibold">{item.title || item.test_slug || item.test}</span>
                  <span className="text-black/42">#{item.order ?? index + 1}</span>
                </div>
              ))}
              {itemsToCreate.length > 8 ? <p className="text-sm font-semibold text-black/45">+{itemsToCreate.length - 8} more</p> : null}
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">My packs</h2>
            <p className="mt-1 text-sm text-black/50">O&apos;zingiz yaratgan packlar, ishlatilishi va ichiga kirib edit qilish.</p>
          </div>
          <span className="rounded-full bg-[#edf7f3] px-3 py-1 text-xs font-semibold text-[#276a5b]">{packs.length} packs</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {packs.map((pack) => {
            const usage = usageBySlug[pack.slug];
            return (
              <Link key={pack.id} href={`/exam-packs/${pack.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf8]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{pack.title}</p>
                    <p className="mt-1 text-sm text-black/52">{pack.exam_type}</p>
                  </div>
                  <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-xs font-semibold text-[#276a5b]">{pack.price_label || "Free"}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-black/58">{pack.description}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Tests" value={pack.item_count} />
                  <MiniStat label="Students" value={usage?.students_submitted ?? 0} />
                  <MiniStat label="Attempts" value={usage?.attempts ?? 0} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-black/45">
                  <span>{pack.visibility}</span>
                  <span>Avg {usage?.average_score ?? 0}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </PremiumPanel>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfbf6] px-3 py-3">
      <p className="text-base font-semibold">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">{label}</p>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <FieldShell label={label}>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} />
    </FieldShell>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Layers3; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold",
        active ? "border-[#151713] bg-[#151713] text-white" : "border-black/10 bg-white text-black/62 hover:bg-[#fbfbf8]",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
