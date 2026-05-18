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
  const [items, setItems] = useState(initialItems);
  const [testId, setTestId] = useState(tests[0]?.id ?? 0);
  const [title, setTitle] = useState(tests[0]?.title ?? "");
  const [order, setOrder] = useState(initialItems.length + 1);
  const [required, setRequired] = useState(true);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = results.results;
  const csv = useMemo(() => [
    "student,test,item,score,correct,total,submitted_at",
    ...rows.map((item) => [item.student_name, item.test_title, item.item_title, item.score, item.correct, item.total, item.submitted_at ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")),
  ].join("\n"), [rows]);
  const filtered = items.filter((item) => `${item.title} ${item.test_title} ${item.difficulty}`.toLowerCase().includes(query.toLowerCase()));

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
    await navigator.clipboard.writeText(`${window.location.origin}/exam-packs/${pack.slug}`);
    setNotice("Pack link clipboardga olindi.");
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
      const [testSlug, itemTitle, orderValue, requiredValue] = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
      return { test_slug: testSlug, title: itemTitle, order: Number(orderValue || index + 1), is_required: requiredValue ? requiredValue.toLowerCase() !== "false" : true };
    });
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

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 text-[#151713] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(21,23,19,0.09)]">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <Eyebrow>Exam pack workspace</Eyebrow>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{pack.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-black/58">{pack.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={copyPackLink} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><Link2 className="size-4" />Copy link</button>
                <button onClick={() => download(`${pack.slug}-results.csv`, csv, "text/csv;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><Download className="size-4" />Export CSV</button>
                <button onClick={() => download(`${pack.slug}.json`, JSON.stringify({ pack, items, results }, null, 2), "application/json;charset=utf-8")} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><FileJson className="size-4" />Export JSON</button>
                <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"><Upload className="size-4" />Import CSV</button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} />
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
            <section className="rounded-[28px] border border-black/8 bg-[#151713] p-5 text-white"><h2 className="text-2xl font-semibold">Weak skills</h2><div className="mt-4 grid gap-3">{results.weak_skills?.length ? results.weak_skills.map((skill) => <div key={skill.skill} className="rounded-2xl bg-white/8 p-4"><div className="flex justify-between text-sm font-semibold"><span>{skill.skill}</span><span>{skill.percent}%</span></div><div className="mt-3 h-2 rounded-full bg-white/12"><div className="h-2 rounded-full bg-[#8fd6bd]" style={{ width: `${skill.percent}%` }} /></div></div>) : <p className="text-sm text-white/65">Natijalar bo&apos;lsa weak skilllar chiqadi.</p>}</div></section>
            <section className="rounded-[28px] border border-black/8 bg-white/82 p-5"><h2 className="text-2xl font-semibold">Import format</h2><div className="mt-4 rounded-2xl bg-[#fbfbf6] p-4 font-mono text-xs leading-6 text-black/62">test_slug,title,order,is_required<br />algebra-basics,Algebra warmup,1,true</div><button onClick={() => download("pack-template.csv", "test_slug,title,order,is_required\nalgebra-basics,Algebra warmup,1,true\n", "text/csv;charset=utf-8")} className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">Download template</button></section>
          </aside>
        </section>

        <StudentPackClient pack={pack} items={items} />

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
