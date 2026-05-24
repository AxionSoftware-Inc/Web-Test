"use client";

import { Check, FileSpreadsheet, Layers3, Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { ApiExamPack, ApiTest, StrictPackImportSource } from "@/shared/api/questlab-api";
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

type PackUsage = { attempts: number; students_submitted: number; average_score: number };

export function ExamPacksClient({ initialPacks, tests, usageBySlug = {} }: { initialPacks: ApiExamPack[]; tests: ApiTest[]; usageBySlug?: Record<string, PackUsage> }) {
  const [packs, setPacks] = useState(initialPacks);
  const [title, setTitle] = useState("DTM Algebra Pack");
  const [examType, setExamType] = useState("DTM Math");
  const [description, setDescription] = useState("Algebra bo'yicha tayyor testlar to'plami.");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [accessCode, setAccessCode] = useState("2026");
  const [priceLabel, setPriceLabel] = useState("99 000 so'm");
  const [mode, setMode] = useState<"select" | "draft">("draft");
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [pasteValue, setPasteValue] = useState("");
  const [jsonSource, setJsonSource] = useState<StrictPackImportSource | null>(null);
  const [loadedFileName, setLoadedFileName] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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

  function setWarning(message: string) {
    setNotice("");
    setError(message);
  }

  async function importStrictSource(source: StrictPackImportSource) {
    if (!source.tests.length) {
      setWarning("JSON ichida tests bo'sh. Kamida bitta test bo'lmasa pack yaratilmaydi.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await questApi.importTestPack({
        source,
        creator_name: "Creator",
        pack_manage_code: getPackManageCode(),
      });
      savePackManageCode(result.pack.slug, result.pack.manage_code);
      setPacks((items) => [result.pack, ...items.filter((item) => item.slug !== result.pack.slug)]);
      setPasteValue("");
      setJsonSource(null);
      setLoadedFileName("");
      setDraftItems([]);
      setSelectedTestIds([]);
      setNotice(`${result.pack.title} DBga saqlandi.`);
      setError(result.skipped.length ? `${result.skipped.length} item import qilinmadi.` : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack import failed.");
    } finally {
      setSaving(false);
    }
  }

  async function createPackWithItems(items: DraftItem[]) {
    if (!items.length) {
      setWarning("Import yoki paste qilingan testlar topilmadi. Bo'sh pack yaratilmaydi.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
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
      if (items.length) {
        const result = await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: pack.manage_code, items });
        if (result.skipped.length) {
          setError(`${result.skipped.length} test qo'shilmadi.`);
        }
      }
      setPacks((items) => [pack, ...items]);
      setDraftItems([]);
      setSelectedTestIds([]);
      setPasteValue("");
      setLoadedFileName("");
      setNotice(`${pack.title} DBga saqlandi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exam pack create failed.");
    } finally {
      setSaving(false);
    }
  }

  async function createPack() {
    if (jsonSource) {
      await importStrictSource(jsonSource);
      return;
    }
    const value = pasteValue.trim();
    if (value) {
      try {
        const parsed = value.startsWith("{") || value.startsWith("[")
          ? JSON.parse(value) as ({ items?: DraftItem[] } | DraftItem[] | StrictPackImportSource)
          : parseLines(value);
        if (!Array.isArray(parsed) && "version" in parsed && parsed.version === "1.0" && parsed.pack && Array.isArray(parsed.tests)) {
          await importStrictSource(parsed);
          return;
        }
        const items = Array.isArray(parsed) ? parsed : "items" in parsed ? parsed.items ?? [] : [];
        await createPackWithItems(items);
        return;
      } catch (err) {
        setWarning(err instanceof Error ? `JSON parse xatosi: ${err.message}` : "JSON parse xatosi.");
        return;
      }
    }
    await createPackWithItems(itemsToCreate);
  }

  async function loadJsonFile(file: File) {
    setError("");
    setNotice("");
    try {
      const parsed = JSON.parse(await file.text()) as {
        version?: string;
        pack?: Partial<ApiExamPack> | StrictPackImportSource["pack"];
        tests?: StrictPackImportSource["tests"];
        items?: Array<{ test_slug?: string; title?: string; order?: number; is_required?: boolean }>;
      };
      if (parsed.version === "1.0" && parsed.pack && Array.isArray(parsed.tests)) {
        setJsonSource(parsed as StrictPackImportSource);
        setDraftItems([]);
        setSelectedTestIds([]);
        setMode("draft");
        setLoadedFileName(file.name);
        setNotice(`${file.name} tayyor. Hali DBga saqlanmadi, chapdagi Create pack bosing.`);
        return;
      }
      if (parsed.items?.length) {
        setDraftItems(parsed.items);
        setJsonSource(null);
        setSelectedTestIds([]);
        setMode("draft");
        setLoadedFileName(file.name);
        setNotice(`${parsed.items.length} item tayyor. Hali DBga saqlanmadi, chapdagi Create pack bosing.`);
        return;
      }
      setWarning("JSON ichida tests yoki items topilmadi. Bo'sh pack yaratilmaydi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON load failed.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function importCsv(file: File) {
    setError("");
    try {
      const items = parseCsv(await file.text());
      setDraftItems(items);
      setJsonSource(null);
      setSelectedTestIds([]);
      setMode("draft");
      setLoadedFileName(file.name);
      setNotice(items.length ? `${items.length} CSV item tayyor. Hali DBga saqlanmadi, chapdagi Create pack bosing.` : "");
      setError(items.length ? "" : "CSV ichida test_slug topilmadi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed.");
    } finally {
      if (csvRef.current) csvRef.current.value = "";
    }
  }

  function toggleTest(testId: number) {
    setJsonSource(null);
    setPasteValue("");
    setLoadedFileName("");
    setSelectedTestIds((current) => current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]);
  }

  const createLabel = saving
    ? "Creating..."
    : jsonSource
      ? `Create imported pack (${jsonSource.tests.length} tests)`
      : itemsToCreate.length
        ? `Create pack with ${itemsToCreate.length} tests`
        : pasteValue.trim()
          ? "Create pack from pasted JSON"
          : "Create pack";

  return (
    <div className="grid gap-4">
      {error || notice ? (
        <div className={cn("rounded-3xl border px-5 py-4 text-sm font-semibold", error ? "border-red-200 bg-red-50 text-red-700" : "border-[#bfe8d8] bg-[#edf7f3] text-[#276a5b]")}>
          {error || notice}
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <PremiumPanel>
        <Eyebrow>Pack info</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold">Create pack</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">Nom, narx va ko&apos;rinishni kiriting. Import/paste qilingan kontent faqat shu tugma bosilganda DBga saqlanadi.</p>
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
            {createLabel}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadJsonFile(file); }} />
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} />
        </div>
      </PremiumPanel>

      <PremiumPanel>
        <div>
          <Eyebrow>Import</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold">JSON pack</h2>
          <p className="mt-2 text-sm leading-6 text-black/55">Qat&apos;iy strukturadagi JSONni paste qiling yoki fayl tanlang. Saqlash faqat chapdagi Create pack orqali bo&apos;ladi.</p>
        </div>

        <section className="mt-5 rounded-3xl border border-black/8 bg-[#fbfbf6] p-4">
          <FieldShell label="Strict JSON yoki { items: [...] }">
            <textarea value={pasteValue} onChange={(event) => { setPasteValue(event.target.value); setJsonSource(null); setDraftItems([]); setSelectedTestIds([]); setMode("draft"); setLoadedFileName(""); setNotice(event.target.value.trim() ? "Paste qilingan JSON hali DBga saqlanmagan. Saqlash uchun chapdagi Create pack bosing." : ""); setError(""); }} rows={10} className={premiumInputClass} placeholder="{\n  &quot;version&quot;: &quot;1.0&quot;,\n  &quot;pack&quot;: { &quot;title&quot;: &quot;Linear Algebra Foundations&quot;, &quot;subject&quot;: &quot;math&quot;, &quot;branch&quot;: &quot;linear-algebra&quot;, &quot;level&quot;: &quot;foundations&quot;, &quot;language&quot;: &quot;uz&quot; },\n  &quot;tests&quot;: [{ &quot;title&quot;: &quot;Vectors Basics&quot;, &quot;topic&quot;: &quot;vectors&quot;, &quot;difficulty&quot;: &quot;easy&quot;, &quot;time_limit_minutes&quot;: 15, &quot;questions&quot;: [] }]\n}" />
          </FieldShell>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-white/70 disabled:opacity-50">
              <Upload className="size-4" />
              Upload JSON
            </button>
            {loadedFileName ? <span className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black/55">{loadedFileName}</span> : null}
          </div>
        </section>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button onClick={() => csvRef.current?.click()} disabled={saving} className="flex min-h-28 items-start gap-3 rounded-2xl border border-black/8 bg-white p-4 text-left hover:bg-[#fbfbf8] disabled:opacity-50">
            <FileSpreadsheet className="mt-1 size-5 text-[#276a5b]" />
            <span><span className="block font-semibold">CSV items</span><span className="mt-1 line-clamp-2 block text-sm text-black/52">{templateCsv.split("\n")[0]}</span></span>
          </button>
          <button onClick={() => setMode("select")} disabled={saving} className="flex min-h-28 items-start gap-3 rounded-2xl border border-black/8 bg-white p-4 text-left hover:bg-[#fbfbf8] disabled:opacity-50">
            <Layers3 className="mt-1 size-5 text-[#276a5b]" />
            <span><span className="block font-semibold">Existing tests</span><span className="mt-1 line-clamp-2 block text-sm text-black/52">Mavjud testlardan pack yig&apos;ish.</span></span>
          </button>
          <Link href="/crud" className="flex min-h-28 items-start gap-3 rounded-2xl border border-black/8 bg-white p-4 text-left hover:bg-[#fbfbf8]">
            <Plus className="mt-1 size-5 text-[#276a5b]" />
            <span><span className="block font-semibold">Manual test</span><span className="mt-1 line-clamp-2 block text-sm text-black/52">Bitta testni qo&apos;lda kiritish.</span></span>
          </Link>
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
