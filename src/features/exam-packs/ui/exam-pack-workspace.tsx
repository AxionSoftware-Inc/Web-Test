"use client";

import { BarChart3, CheckCircle2, Download, FileJson, FileUp, Link2, Plus, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { ApiExamPack, ApiExamPackItem, ApiExamPackResults, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getPackManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, premiumInputClass } from "@/shared/ui/premium-shell";
import { StudentPackClient } from "./student-pack-client";

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
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const rows = results.results;
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

  async function importJson(file: File) {
    setBusy(true);
    setNotice("");
    try {
      const raw = JSON.parse(await file.text()) as { items?: Array<{ test_slug?: string; title?: string; order?: number; is_required?: boolean; test?: number }> };
      const body = Array.isArray(raw.items) ? raw.items : [];
      const imported = await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: getPackManageCode(pack.slug), items: body });
      setItems((current) => [...current, ...imported.created].sort((a, b) => a.order - b.order));
      setNotice(`${imported.created.length} ta JSON item import qilindi. ${imported.skipped.length} ta qator o'tkazib yuborildi.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "JSON import failed.");
    } finally {
      setBusy(false);
      if (jsonRef.current) jsonRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 text-[#151713] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(21,23,19,0.09)]">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <Eyebrow>Exam pack workspace</Eyebrow>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{currentPack.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-black/58">{currentPack.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={copyPackLink} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><Link2 className="size-4" />Copy link</button>
                <button onClick={() => download(`${currentPack.slug}-results.csv`, csv, "text/csv;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><Download className="size-4" />Export CSV</button>
                <button onClick={() => download(`${currentPack.slug}.json`, JSON.stringify({ version: "1.0", pack: currentPack, tests: exportTests, items, results }, null, 2), "application/json;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><FileJson className="size-4" />Export JSON</button>
                <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><Upload className="size-4" />Import CSV</button>
                <button onClick={() => jsonRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><FileJson className="size-4" />Import JSON</button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} />
                <input ref={jsonRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importJson(file); }} />
              </div>
              {notice ? <p className="mt-4 rounded-2xl bg-[#fbfbf6] px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
            </div>
            <div className="bg-[#151713] p-6 text-white">
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

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><Eyebrow>Pack builder</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Testlarni packga qo&apos;shish</h2></div>
              <Link href={`/exam-packs/${pack.slug}/add-test`} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white">Advanced add</Link>
            </div>
            <div className="mt-5 grid gap-4 rounded-3xl border border-black/8 bg-[#fbfbf6] p-4 lg:grid-cols-[1fr_1fr_90px_auto_auto] lg:items-end">
              <FieldShell label="Backend test"><select value={testId} onChange={(event) => { const id = Number(event.target.value); setTestId(id); setTitle(tests.find((test) => test.id === id)?.title ?? title); }} className={premiumInputClass}>{tests.map((test) => <option key={test.id} value={test.id}>{test.title} / {test.difficulty}</option>)}</select></FieldShell>
              <FieldShell label="Item title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={premiumInputClass} /></FieldShell>
              <FieldShell label="Order"><input type="number" value={order} onChange={(event) => setOrder(Number(event.target.value))} className={premiumInputClass} /></FieldShell>
              <button type="button" onClick={() => setRequired((value) => !value)} className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", required ? "border-[#8fd6bd] bg-[#edf7f3] text-[#276a5b]" : "border-black/10 bg-white text-black/55")}>{required ? "Required" : "Optional"}</button>
              <button onClick={addItem} disabled={busy || !testId} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" />Add</button>
            </div>
            <div className="mt-5 rounded-3xl border border-black/8 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Bulk select from tests</p>
                  <p className="mt-1 text-sm text-black/50">Bir nechta backend testni tanlab, bitta bosishda packga qo&apos;shing.</p>
                </div>
                <button onClick={addSelectedTests} disabled={busy || !selectedTestIds.length} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Add {selectedTestIds.length || ""}</button>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/8 bg-[#fbfbf6] px-4 py-3">
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
                      className={cn("rounded-2xl border p-4 text-left text-sm disabled:cursor-not-allowed disabled:opacity-45", selected ? "border-[#276a5b] bg-[#edf7f3]" : "border-black/8 bg-[#fbfbf6] hover:bg-white")}
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
                <article key={item.id} className="grid gap-4 rounded-3xl border border-black/8 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-black/52">{item.test_title} / {item.difficulty} / {item.question_count} questions</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void toggleItem(item)} disabled={busy} className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", item.is_required ? "border-[#8fd6bd] text-[#276a5b]" : "border-black/10 text-black/55")}>{item.is_required ? "Required" : "Optional"}</button>
                    <button onClick={() => void removeItem(item)} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl border border-red-100 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="size-4" />Remove</button>
                    <Link href={`/tests/${item.test_slug}`} className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">Open test</Link>
                  </div>
                </article>
              ))}
              {!filtered.length ? <div className="rounded-3xl border border-dashed border-black/12 bg-white p-8 text-center"><FileUp className="mx-auto size-9 text-black/28" /><p className="mt-3 font-semibold">Pack item yo&apos;q</p></div> : null}
            </div>
          </div>
          <aside className="grid gap-6">
            <section className="rounded-[28px] border border-black/8 bg-white/82 p-5">
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
                <button onClick={savePack} disabled={busy} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Save changes</button>
              </div>
            </section>
            <section className="rounded-[28px] border border-black/8 bg-[#151713] p-5 text-white"><h2 className="text-2xl font-semibold">Weak skills</h2><div className="mt-4 grid gap-3">{results.weak_skills?.length ? results.weak_skills.map((skill) => <div key={skill.skill} className="rounded-2xl bg-white/8 p-4"><div className="flex justify-between text-sm font-semibold"><span>{skill.skill}</span><span>{skill.percent}%</span></div><div className="mt-3 h-2 rounded-full bg-white/12"><div className="h-2 rounded-full bg-[#8fd6bd]" style={{ width: `${skill.percent}%` }} /></div></div>) : <p className="text-sm text-white/65">Natijalar bo&apos;lsa weak skilllar chiqadi.</p>}</div></section>
            <section className="rounded-[28px] border border-black/8 bg-white/82 p-5"><h2 className="text-2xl font-semibold">Pack qo&apos;shish usullari</h2><div className="mt-4 grid gap-3 text-sm text-black/58"><p><strong>Manual:</strong> bitta-bitta backend test tanlab qo&apos;shish.</p><p><strong>CSV:</strong> katta packni jadvaldan import qilish.</p><p><strong>JSON:</strong> boshqa akkaunt yoki backupdan pack itemlarni qayta yuklash.</p></div></section>
            <section className="rounded-[28px] border border-black/8 bg-white/82 p-5"><h2 className="text-2xl font-semibold">Import format</h2><div className="mt-4 rounded-2xl bg-[#fbfbf6] p-4 font-mono text-xs leading-6 text-black/62">test_slug,title,order,is_required<br />algebra-basics,Algebra warmup,1,true</div><button onClick={() => download("pack-template.csv", "test_slug,title,order,is_required\nalgebra-basics,Algebra warmup,1,true\n", "text/csv;charset=utf-8")} className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">Download template</button></section>
          </aside>
        </section>

        <StudentPackClient pack={currentPack} items={items} />

        <section className="mt-6 rounded-[28px] border border-black/8 bg-white/82 p-5">
          <Eyebrow>Pack results</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Student progress</h2>
          <div className="mt-5 grid gap-3">
            {results.student_progress?.map((student) => <div key={student.student_code} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 md:grid-cols-[1fr_120px_120px_180px]"><p className="font-semibold">{student.student_name}</p><p>{student.completed}/{items.length} tests</p><span className="w-fit rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">{student.average_score}%</span><p className="text-sm text-black/48">{student.last_submitted_at ? new Date(student.last_submitted_at).toLocaleString() : "No submit"}</p></div>)}
            {!results.student_progress?.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Hali pack natijalari yo&apos;q.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string | number }) {
  return <div className="rounded-2xl bg-white/8 p-4"><Icon className="size-4 text-[#8fd6bd]" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}
