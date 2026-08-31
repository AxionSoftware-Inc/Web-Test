"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardPaste, FileUp, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import type { ApiSkill, ApiSubject, ApiTest, ApiTopic, StrictPackImportSource } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getCreatorCode, getPackManageCode, savePackManageCode } from "@/shared/model/local-identity";
import { FieldShell, premiumInputClass } from "@/shared/ui/premium-shell";
import { cn } from "@/shared/lib/cn";
import { parseTeacherContent, type TeacherImportResult } from "@/features/exam-packs/lib/teacher-import-parser";
import type { ImportQuestion } from "@/features/exam-packs/lib/import-parser";
import { parseTeacherFile } from "@/features/crud/lib/teacher-file-parser";

type SourceMode = "paste" | "file" | "manual";
type StudioStep = "source" | "review";

type ManualQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

type TeacherDraft = {
  step?: StudioStep;
  sourceMode?: SourceMode;
  title?: string;
  subjectId?: number;
  topicId?: number;
  difficulty?: ApiTest["difficulty"];
  minutes?: number;
  pasteText?: string;
  fileName?: string;
  source?: StrictPackImportSource | null;
  warnings?: string[];
  manualQuestions?: ManualQuestion[];
};

type Props = {
  subjects: ApiSubject[];
  topics: ApiTopic[];
  tests: ApiTest[];
  skills: ApiSkill[];
};

const exampleText = `Test: Integral asoslari
Fan: Matematika
Bo'lim: Integral

1. ∫ x dx = ?
A) x² + C
B) x²/2 + C
C) 2x + C
D) x + C
Javob: B
Izoh: Daraja birga oshiriladi va yangi darajaga bo'linadi.

2. ∫ 1/x dx = ?
A) ln|x| + C
B) x + C
C) 1/x² + C
Javob: A`;

const draftStorageKey = "questlab:teacher-test-studio:draft:v1";

function normalizeQuestionBody(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function getDraftSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(draftStorageKey);
  } catch {
    return null;
  }
}

function parseTeacherDraft(saved: string | null): TeacherDraft | null {
  if (!saved) return null;
  try {
    return JSON.parse(saved) as TeacherDraft;
  } catch {
    return null;
  }
}

function emptyManualQuestion(): ManualQuestion {
  return { prompt: "", options: ["", "", "", ""], answer: "A", explanation: "" };
}

function apiDifficultyToImport(value: ApiTest["difficulty"]): "easy" | "medium" | "hard" {
  if (value === "advanced") return "hard";
  if (value === "intermediate") return "medium";
  return "easy";
}

function answerValue(question: ImportQuestion) {
  return typeof question.answer === "string" ? question.answer : question.answer.correct;
}

function answerOption(question: ImportQuestion, option: { id: string; text: string }) {
  const answer = answerValue(question).trim().toLowerCase();
  return answer === option.id.toLowerCase() || answer === option.text.trim().toLowerCase();
}

function teacherSourceFromManual(title: string, topic: ApiTopic | undefined, difficulty: ApiTest["difficulty"], questions: ManualQuestion[]): StrictPackImportSource {
  const importedDifficulty = apiDifficultyToImport(difficulty);
  return {
    version: "1.0",
    pack: {
      title: title.trim() || "Yangi test",
      subject: "general",
      branch: topic?.slug || "general",
      level: importedDifficulty,
      language: "uz",
    },
    tests: [{
      title: title.trim() || "Yangi test",
      topic: topic?.slug || "general",
      difficulty: importedDifficulty,
      time_limit_minutes: 15,
      questions: questions.map((question) => ({
        type: "single_choice",
        body: question.prompt,
        options: question.options.map((text, index) => ({ id: String.fromCharCode(65 + index), text: text.trim() })).filter((option) => option.text),
        answer: { correct: question.answer },
        explanation: question.explanation,
        skills: ["general"],
        difficulty: importedDifficulty,
      })),
    }],
  };
}

export function TeacherTestStudio(props: Props) {
  const isClient = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const draftSnapshot = useSyncExternalStore(() => () => undefined, getDraftSnapshot, () => null);
  if (!isClient) return <div className="mx-auto min-h-[420px] max-w-6xl rounded-[32px] border border-black/8 bg-white/70" aria-busy="true" />;
  return <TeacherTestStudioForm key={draftSnapshot ?? "empty"} {...props} savedDraft={parseTeacherDraft(draftSnapshot)} />;
}

function TeacherTestStudioForm({ subjects, topics, savedDraft }: Props & { savedDraft: TeacherDraft | null }) {
  const defaultSubject = subjects.find((subject) => subject.slug === "mathematics") ?? subjects[0];
  const defaultTopic = topics.find((topic) => topic.slug === "algebra") ?? topics.find((topic) => topic.subject === defaultSubject?.id) ?? topics[0];
  const [step, setStep] = useState<StudioStep>(savedDraft?.step === "review" ? "review" : "source");
  const [sourceMode, setSourceMode] = useState<SourceMode>(savedDraft?.sourceMode ?? "paste");
  const [title, setTitle] = useState(savedDraft?.title ?? "Yangi test");
  const [subjectId, setSubjectId] = useState(savedDraft?.subjectId ?? defaultSubject?.id ?? 0);
  const [topicId, setTopicId] = useState(savedDraft?.topicId ?? defaultTopic?.id ?? 0);
  const [difficulty, setDifficulty] = useState<ApiTest["difficulty"]>(savedDraft?.difficulty ?? "beginner");
  const [minutes, setMinutes] = useState(savedDraft?.minutes ?? 15);
  const [pasteText, setPasteText] = useState(savedDraft?.pasteText ?? "");
  const [fileName, setFileName] = useState(savedDraft?.fileName ?? "");
  const [source, setSource] = useState<StrictPackImportSource | null>(savedDraft?.source ?? null);
  const [warnings, setWarnings] = useState<string[]>(savedDraft?.warnings ?? []);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>(savedDraft?.manualQuestions?.length ? savedDraft.manualQuestions : [emptyManualQuestion()]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(savedDraft ? "Qoralama avtomatik tiklandi." : "");
  const [createdPackSlug, setCreatedPackSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify({
        step,
        sourceMode,
        title,
        subjectId,
        topicId,
        difficulty,
        minutes,
        pasteText,
        fileName,
        source,
        warnings,
        manualQuestions,
      }));
    } catch {
      // Draft persistence is best effort and must never block test authoring.
    }
  }, [difficulty, fileName, manualQuestions, minutes, pasteText, source, sourceMode, step, subjectId, title, topicId, warnings]);

  const visibleTopics = useMemo(() => topics.filter((topic) => topic.subject === subjectId), [subjectId, topics]);
  const selectedTopic = topics.find((topic) => topic.id === topicId) ?? visibleTopics[0];
  const selectedSubject = subjects.find((subject) => subject.id === subjectId);

  const issues = useMemo(() => {
    const result: Array<{ testIndex: number; questionIndex?: number; message: string }> = [];
    if (!source) return result;
    source.tests.forEach((test, testIndex) => {
      if (!test.title.trim()) result.push({ testIndex, message: "Test nomi bo'sh." });
      test.questions.forEach((question, questionIndex) => {
        if (!question.body.trim()) result.push({ testIndex, questionIndex, message: "Savol matnini kiriting." });
        const options = question.options ?? [];
        if (question.type !== "short_answer" && options.filter((option) => option.text.trim()).length < 2) {
          result.push({ testIndex, questionIndex, message: "Kamida 2 ta variant kerak." });
        }
        if (!answerValue(question).trim()) {
          result.push({ testIndex, questionIndex, message: "To'g'ri javobni tanlang." });
        } else if (question.type !== "short_answer" && options.length && !options.some((option) => option.text.trim() && answerOption(question, option))) {
          result.push({ testIndex, questionIndex, message: "To'g'ri javob variantlardan biriga mos emas." });
        }
      });
    });
    return result;
  }, [source]);

  const duplicateKeys = useMemo(() => {
    const occurrences = new Map<string, string[]>();
    source?.tests.forEach((test, testIndex) => test.questions.forEach((question, questionIndex) => {
      const normalized = normalizeQuestionBody(question.body);
      if (!normalized) return;
      const key = `${testIndex}:${questionIndex}`;
      const current = occurrences.get(normalized) ?? [];
      current.push(key);
      occurrences.set(normalized, current);
    }));
    return new Set([...occurrences.values()].filter((keys) => keys.length > 1).flat());
  }, [source]);

  const checklist = useMemo(() => [
    { label: "Test nomi yozilgan", ok: Boolean(title.trim()) },
    { label: "Fan va bo'lim tanlangan", ok: Boolean(subjectId && topicId) },
    { label: "Kamida bitta savol bor", ok: Boolean(source?.tests.some((test) => test.questions.length)) },
    { label: "Savol va variantlar to'liq", ok: !issues.some((item) => item.message === "Savol matnini kiriting." || item.message === "Kamida 2 ta variant kerak.") },
    { label: "To'g'ri javoblar mos", ok: !issues.some((item) => item.message.includes("To'g'ri javob")) },
  ], [issues, source, subjectId, title, topicId]);

  const canSave = checklist.every((item) => item.ok) && !issues.length;

  function updateSource(next: (current: StrictPackImportSource) => StrictPackImportSource) {
    setSource((current) => current ? next(current) : current);
  }

  function updateQuestion(testIndex: number, questionIndex: number, patch: Partial<ImportQuestion>) {
    updateSource((current) => ({
      ...current,
      tests: current.tests.map((test, currentTestIndex) => currentTestIndex !== testIndex ? test : {
        ...test,
        questions: test.questions.map((question, currentQuestionIndex) => currentQuestionIndex !== questionIndex ? question : { ...question, ...patch }),
      }),
    }));
  }

  function removeQuestion(testIndex: number, questionIndex: number) {
    updateSource((current) => ({
      ...current,
      tests: current.tests.map((test, currentTestIndex) => currentTestIndex !== testIndex ? test : {
        ...test,
        questions: test.questions.filter((_, currentQuestionIndex) => currentQuestionIndex !== questionIndex),
      }),
    }));
  }

  function startReview(result: TeacherImportResult) {
    const firstTest = result.source.tests[0];
    const nextTitle = firstTest?.title.trim() || result.source.pack.title.trim() || "Yangi test";
    setTitle(nextTitle);
    setSource({
      ...result.source,
      pack: { ...result.source.pack, title: nextTitle },
      tests: result.source.tests.map((test, index) => index === 0 ? { ...test, title: nextTitle } : test),
    });
    setWarnings(result.warnings);
    setError("");
    setNotice("");
    setStep("review");
  }

  function parseInput(text: string, format?: "csv") {
    try {
      startReview(parseTeacherContent(text, {
        fallbackTitle: title,
        fallbackTopic: selectedTopic?.slug || "general",
        format,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Savollarni o'qib bo'lmadi.");
      setNotice("");
    }
  }

  function reviewPastedText() {
    parseInput(pasteText);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setError("");
    void parseTeacherFile(file, selectedTopic?.slug || "general")
      .then(startReview)
      .catch((err) => setError(err instanceof Error ? err.message : "Faylni o'qib bo'lmadi."));
  }

  function reviewManualQuestions() {
    const manualSource = teacherSourceFromManual(title, selectedTopic, difficulty, manualQuestions);
    startReview({ source: manualSource, warnings: [], format: "teacher-text" });
  }

  function changeSourceMode(nextMode: SourceMode) {
    setSourceMode(nextMode);
    setError("");
    setNotice("");
  }

  function updateManualQuestion(index: number, patch: Partial<ManualQuestion>) {
    setManualQuestions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function applySaveMetadata(current: StrictPackImportSource): StrictPackImportSource {
    const importedDifficulty = apiDifficultyToImport(difficulty);
    return {
      ...current,
      pack: {
        ...current.pack,
        title: title.trim(),
        subject: selectedSubject?.slug || current.pack.subject || "general",
        branch: selectedTopic?.slug || current.pack.branch || "general",
        level: importedDifficulty,
        language: "uz",
      },
      tests: current.tests.map((test, index) => ({
        ...test,
        title: index === 0 ? title.trim() : test.title.trim() || `${title.trim()} ${index + 1}`,
        topic: selectedTopic?.slug || test.topic,
        difficulty: importedDifficulty,
        time_limit_minutes: minutes,
        questions: test.questions.map((question) => ({
          ...question,
          skills: question.skills.length ? question.skills : ["general"],
        })),
      })),
    };
  }

  async function saveToBank(status: "draft" | "published") {
    if (!source) return;
    if (issues.length) {
      setError(`${issues.length} ta joyni tekshiring. Qizil yozuv turgan savolni tuzating.`);
      return;
    }
    if (!title.trim() || !subjectId || !topicId) {
      setError("Test nomi, fan va bo'limni tanlang.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    setCreatedPackSlug("");
    try {
      const creatorCode = getCreatorCode();
      const manageCode = getPackManageCode();
      const result = await questApi.importTestPack({
        source: applySaveMetadata(source),
        status,
        creator_name: "Teacher",
        creator_code: creatorCode,
        manage_key: creatorCode,
        pack_manage_code: manageCode,
      });
      savePackManageCode(result.pack.slug, manageCode);
      window.localStorage.removeItem(draftStorageKey);
      setCreatedPackSlug(result.pack.slug);
      setNotice(`${result.tests.length} ta test ${status === "draft" ? "qoralama sifatida saqlandi" : "publish qilindi"}.` + (result.skipped.length ? ` ${result.skipped.length} tasi o'tkazib yuborildi.` : ""));
      if (result.skipped.length) setWarnings(result.skipped.slice(0, 3).map((item) => `${item.title}: ${item.reason}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Testlarni saqlashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[32px] border border-black/8 bg-white/88 p-5 shadow-[0_24px_80px_rgba(21,23,19,0.08)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">O&apos;qituvchi studiyasi</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Testni eng oson usulda qo&apos;shing</h1>
            <p className="mt-3 text-base leading-7 text-black/58">Word, Telegram yoki AI’dan tayyor savollarni ko&apos;chiring. QuestLab ularni ajratadi, siz tekshirasiz va bitta tugma bilan bazaga saqlaysiz.</p>
          </div>
          <Link href="/crud?mode=advanced" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/65 hover:bg-surface-soft">Kengaytirilgan editor</Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <StepPill number="1" title="Kiritish" active={step === "source"} done={step === "review"} />
          <StepPill number="2" title="Tekshirish va saqlash" active={step === "review"} done={false} />
        </div>

        {step === "source" && notice ? <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p> : null}

        {step === "source" ? (
          <div className="mt-8">
            <div className="grid gap-3 md:grid-cols-3">
              <SourceCard icon={<ClipboardPaste className="size-5" />} title="Tayyor matnni qo&apos;ying" copy="Word, Telegram yoki AI’dan ko&apos;chiring" active={sourceMode === "paste"} recommended onClick={() => changeSourceMode("paste")} />
              <SourceCard icon={<FileUp className="size-5" />} title="Fayl yuklang" copy="Excel, Word, CSV, JSON yoki TXT" active={sourceMode === "file"} onClick={() => changeSourceMode("file")} />
              <SourceCard icon={<Plus className="size-5" />} title="Qo&apos;lda yozing" copy="1–3 ta savol uchun tezkor forma" active={sourceMode === "manual"} onClick={() => changeSourceMode("manual")} />
            </div>

            {sourceMode === "paste" ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <FieldShell label="Savollar matni">
                    <textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} rows={15} className={cn(premiumInputClass, "min-h-[300px] resize-y font-mono text-sm leading-6")} placeholder={exampleText} aria-label="Savollar matni" />
                  </FieldShell>
                  <p className="mt-2 text-xs leading-5 text-black/48">Maxsus formatni yodlash shart emas. Raqamlangan savol, A/B/C variantlar va “Javob: B” bo&apos;lsa yetarli.</p>
                  <Button onClick={reviewPastedText} disabled={!pasteText.trim()} size="lg" className="mt-5"><Sparkles className="size-4" /> Savollarni topish</Button>
                </div>
                <div className="rounded-3xl border border-accent/25 bg-accent/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Namuna</p>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-ink/75">{exampleText}</pre>
                  <button type="button" onClick={() => setPasteText(exampleText)} className="mt-4 text-sm font-semibold text-brand underline underline-offset-4">Namunani qo&apos;yish</button>
                </div>
              </div>
            ) : null}

            {sourceMode === "file" ? (
              <div className="mt-6 rounded-3xl border border-dashed border-black/18 bg-surface-soft p-8 text-center">
                <FileUp className="mx-auto size-8 text-brand" />
                <h2 className="mt-4 text-xl font-semibold">Faylni shu yerga tanlang</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-black/55">Excel, Word, CSV, JSON, TXT va MD qabul qilinadi. Excel jadvalining birinchi qatoriga question, A, B, C, D, answer ustunlarini qo&apos;ying.</p>
                <input ref={fileRef} id="teacher-test-file" type="file" accept=".xlsx,.xls,.docx,.csv,.json,.txt,.md,text/csv,application/json,text/plain" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file); }} />
                <label htmlFor="teacher-test-file" className="mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"><FileUp className="size-4" /> Fayl tanlash</label>
                {fileName ? <p className="mt-4 text-sm font-semibold text-brand">Tanlandi: {fileName}</p> : null}
              </div>
            ) : null}

            {sourceMode === "manual" ? (
              <div className="mt-6 grid gap-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                  <FieldShell label="Test nomi">
                    <input value={title} onChange={(event) => setTitle(event.target.value)} className={premiumInputClass} placeholder="Masalan, Integral asoslari" />
                  </FieldShell>
                  <FieldShell label="Fan">
                    <select value={subjectId} onChange={(event) => { const next = Number(event.target.value); setSubjectId(next); setTopicId(topics.find((topic) => topic.subject === next)?.id ?? 0); }} className={premiumInputClass}>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
                    </select>
                  </FieldShell>
                </div>
                {manualQuestions.map((question, index) => (
                  <ManualQuestionCard key={index} index={index} question={question} onChange={(patch) => updateManualQuestion(index, patch)} onRemove={() => setManualQuestions((items) => items.length > 1 ? items.filter((_, itemIndex) => itemIndex !== index) : items)} canRemove={manualQuestions.length > 1} />
                ))}
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" onClick={() => setManualQuestions((items) => [...items, emptyManualQuestion()])}><Plus className="size-4" /> Yana savol</Button>
                  <Button type="button" onClick={reviewManualQuestions}><ArrowRight className="size-4" /> Tekshirishga o&apos;tish</Button>
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-[#f3f3ec] p-4 text-sm leading-6 text-black/58"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" /><p><span className="font-semibold text-ink">Sizdan faqat mazmun kerak.</span> Slug, texnik JSON, skill ID yoki murakkab sozlamalarni QuestLab o&apos;zi hal qiladi.</p></div>
          </div>
        ) : null}

        {step === "review" && source ? (
          <div className="mt-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand">Topildi: {source.tests.reduce((total, test) => total + test.questions.length, 0)} ta savol</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">Saqlashdan oldin tekshiring</h2>
                  </div>
                  <Button variant="secondary" onClick={() => setStep("source")}><ArrowLeft className="size-4" /> Orqaga</Button>
                </div>
                {warnings.length ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><p className="font-semibold">E&apos;tibor beriladigan joylar</p><ul className="mt-1 list-disc pl-5">{warnings.slice(0, 5).map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
                <div className="mt-5 grid gap-4">
                  {source.tests.map((test, testIndex) => (
                    <section key={`${test.title}-${testIndex}`} className="rounded-3xl border border-black/8 bg-surface-soft p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">Test {testIndex + 1}</p><h3 className="mt-1 text-lg font-semibold">{test.title || "Nomsiz test"}</h3></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/55">{test.questions.length} savol</span></div>
                      <div className="mt-4 grid gap-4">
                        {test.questions.map((question, questionIndex) => {
                          const issue = issues.find((item) => item.testIndex === testIndex && item.questionIndex === questionIndex);
                          const options = question.options ?? [];
                          const questionKey = `${testIndex}:${questionIndex}`;
                          const isDuplicate = duplicateKeys.has(questionKey);
                          return <article key={questionIndex} className={cn("rounded-2xl border bg-white p-4", issue ? "border-red-300" : isDuplicate ? "border-amber-300" : "border-black/8")}>
                            <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Savol {questionIndex + 1}</p><div className="flex items-center gap-3">{issue ? <span className="text-xs font-semibold text-red-600">{issue.message}</span> : isDuplicate ? <span className="text-xs font-semibold text-amber-700">Takroriy savol</span> : <Check className="size-4 text-brand" />}<button type="button" onClick={() => removeQuestion(testIndex, questionIndex)} className="grid size-7 place-items-center rounded-lg text-black/35 hover:bg-red-50 hover:text-red-600" aria-label={`Savol ${questionIndex + 1} ni o'chirish`}><Trash2 className="size-3.5" /></button></div></div>
                            <textarea value={question.body} onChange={(event) => updateQuestion(testIndex, questionIndex, { body: event.target.value })} rows={2} className={cn(premiumInputClass, "mt-3 resize-y")} aria-label={`Savol ${questionIndex + 1} matni`} />
                            {options.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{options.map((option, optionIndex) => <div key={`${option.id}-${optionIndex}`} className="flex items-center gap-2"><button type="button" onClick={() => updateQuestion(testIndex, questionIndex, { answer: { correct: option.id } })} className={cn("grid size-9 shrink-0 place-items-center rounded-xl border text-xs font-bold", answerOption(question, option) ? "border-brand bg-brand text-white" : "border-black/10 bg-white text-black/45")} aria-label={`${option.id} javobini tanlash`}>{option.id}</button><input value={option.text} onChange={(event) => updateQuestion(testIndex, questionIndex, { options: options.map((item, currentIndex) => currentIndex === optionIndex ? { ...item, text: event.target.value } : item) })} className={cn(premiumInputClass, "min-w-0 flex-1 px-3 py-2 text-sm")} aria-label={`${option.id} varianti`} /></div>)}</div> : <FieldShell label="To'g'ri javob"><input value={answerValue(question)} onChange={(event) => updateQuestion(testIndex, questionIndex, { answer: { correct: event.target.value } })} className={cn(premiumInputClass, "mt-2")} aria-label={`Savol ${questionIndex + 1} javobi`} /></FieldShell>}
                            {options.length ? <p className="mt-2 text-xs text-black/45">To&apos;g&apos;ri javobni chapdagi harfdan tanlang.</p> : null}
                            <FieldShell label="Izoh (ixtiyoriy)"><textarea value={question.explanation ?? ""} onChange={(event) => updateQuestion(testIndex, questionIndex, { explanation: event.target.value })} rows={2} className={cn(premiumInputClass, "mt-2 resize-y text-sm")} aria-label={`Savol ${questionIndex + 1} izohi`} /></FieldShell>
                          </article>;
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>

              <aside className="h-fit rounded-3xl border border-black/8 bg-surface-soft p-5 lg:sticky lg:top-24">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">Bazaga saqlash</p>
                <FieldShell label="Test nomi"><input value={title} onChange={(event) => setTitle(event.target.value)} className={cn(premiumInputClass, "mt-2")} /></FieldShell>
                <div className="mt-4 grid gap-3">
                  <FieldShell label="Fan"><select value={subjectId} onChange={(event) => { const next = Number(event.target.value); setSubjectId(next); setTopicId(topics.find((topic) => topic.subject === next)?.id ?? 0); }} className={premiumInputClass}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select></FieldShell>
                  <FieldShell label="Bo&apos;lim"><select value={topicId} onChange={(event) => setTopicId(Number(event.target.value))} className={premiumInputClass}>{visibleTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></FieldShell>
                  <div className="grid grid-cols-2 gap-3"><FieldShell label="Daraja"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as ApiTest["difficulty"])} className={premiumInputClass}><option value="beginner">Oson</option><option value="intermediate">O&apos;rta</option><option value="advanced">Qiyin</option></select></FieldShell><FieldShell label="Vaqt (min) "><input type="number" min={1} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className={premiumInputClass} /></FieldShell></div>
                </div>
                <div className="mt-5 rounded-2xl bg-white p-4 text-sm leading-6 text-black/58"><p className="font-semibold text-ink">Saqlashdan oldingi tekshiruv</p><div className="mt-3 grid gap-2">{checklist.map((item) => <div key={item.label} className="flex items-center gap-2"><span className={cn("grid size-5 place-items-center rounded-full", item.ok ? "bg-emerald-100 text-emerald-700" : "bg-black/6 text-black/30")}>{item.ok ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}</span><span className={cn("text-xs", item.ok ? "text-black/70" : "text-black/40")}>{item.label}</span></div>)}</div>{duplicateKeys.size ? <p className="mt-3 text-xs leading-5 text-amber-700">{duplicateKeys.size} ta takroriy savol topildi. Saqlash mumkin, lekin bittasini o&apos;chirib tashlash tavsiya qilinadi.</p> : null}</div>
                {issues.length ? <p className="mt-4 text-sm font-semibold text-red-600">Saqlash uchun {issues.length} ta joyni tuzating.</p> : null}
                <Button onClick={() => void saveToBank("published")} disabled={saving || !canSave} size="lg" className="mt-5 w-full">{saving ? "Saqlanmoqda..." : "Tekshirilgan deb publish qilish"} <ArrowRight className="size-4" /></Button>
                <Button onClick={() => void saveToBank("draft")} disabled={saving || !canSave} variant="secondary" className="mt-2 w-full">Qoralama sifatida saqlash</Button>
                {notice ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold leading-5 text-emerald-800">{notice}{createdPackSlug ? <><br /><Link className="underline" href={`/exam-packs/${createdPackSlug}`}>Bazani ochish</Link></> : null}</p> : null}
              </aside>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">{error}</p> : null}
      </section>
    </div>
  );
}

function StepPill({ number, title, active, done }: { number: string; title: string; active: boolean; done: boolean }) {
  return <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", active ? "border-brand bg-accent/10" : "border-black/8 bg-surface-soft")}><span className={cn("grid size-8 place-items-center rounded-xl text-sm font-bold", active || done ? "bg-brand text-white" : "bg-white text-black/45")}>{done ? <Check className="size-4" /> : number}</span><span className={cn("text-sm font-semibold", active ? "text-ink" : "text-black/48")}>{title}</span></div>;
}

function SourceCard({ icon, title, copy, active, recommended, onClick }: { icon: React.ReactNode; title: string; copy: string; active: boolean; recommended?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("relative rounded-3xl border p-4 text-left transition", active ? "border-brand bg-accent/10 shadow-sm" : "border-black/8 bg-surface-soft hover:border-black/20 hover:bg-white")}><span className={cn("grid size-10 place-items-center rounded-2xl", active ? "bg-brand text-white" : "bg-white text-brand")}>{icon}</span><p className="mt-4 font-semibold text-ink">{title}</p><p className="mt-1 text-sm leading-5 text-black/52">{copy}</p>{recommended ? <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Tavsiya</span> : null}</button>;
}

function ManualQuestionCard({ index, question, onChange, onRemove, canRemove }: { index: number; question: ManualQuestion; onChange: (patch: Partial<ManualQuestion>) => void; onRemove: () => void; canRemove: boolean }) {
  return <article className="rounded-3xl border border-black/8 bg-surface-soft p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Savol {index + 1}</h2>{canRemove ? <button type="button" onClick={onRemove} className="grid size-9 place-items-center rounded-xl border border-black/10 bg-white text-black/45 hover:text-red-600" aria-label={`Savol ${index + 1} ni o'chirish`}><Trash2 className="size-4" /></button> : null}</div><FieldShell label="Savol matni"><textarea value={question.prompt} onChange={(event) => onChange({ prompt: event.target.value })} rows={2} className={cn(premiumInputClass, "mt-2 resize-y")} placeholder="Savolni yozing" /></FieldShell><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const id = String.fromCharCode(65 + optionIndex); return <div key={id} className="flex items-center gap-2"><button type="button" onClick={() => onChange({ answer: id })} className={cn("grid size-9 shrink-0 place-items-center rounded-xl border text-xs font-bold", question.answer === id ? "border-brand bg-brand text-white" : "border-black/10 bg-white text-black/45")} aria-label={`${id} javobini tanlash`}>{id}</button><input value={option} onChange={(event) => onChange({ options: question.options.map((item, currentIndex) => currentIndex === optionIndex ? event.target.value : item) })} className={cn(premiumInputClass, "min-w-0 flex-1 px-3 py-2 text-sm")} placeholder={`${id} varianti`} aria-label={`${id} varianti`} /></div>; })}</div><FieldShell label="Izoh (ixtiyoriy)"><textarea value={question.explanation} onChange={(event) => onChange({ explanation: event.target.value })} rows={2} className={cn(premiumInputClass, "mt-4 resize-y text-sm")} placeholder="Nima uchun shu javob to'g'ri?" /></FieldShell></article>;
}
