"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  ExternalLink,
  FileUp,
  Lightbulb,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import React, { useId, useMemo, useRef, useState } from "react";

import { LatexText } from "@/shared/ui/latex-text";
import { cn } from "@/shared/lib/cn";
import { questApi } from "@/shared/api/questlab-api";
import { getCreatorCode } from "@/shared/model/local-identity";
import { parseTeacherContent } from "@/features/exam-packs/lib/teacher-import-parser";
import { parseTeacherFile } from "@/features/crud/lib/teacher-file-parser";
import type { ImportQuestion } from "@/features/exam-packs/lib/import-parser";

interface StudioQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string; // "A", "B", "C", "D" yoki indeks
  explanation: string;
}

const PRESET_TEMPLATES = [
  {
    name: "Matematika: Kvadrat tenglamalar",
    subject: "Matematika",
    topic: "Kvadrat tenglamalar",
    difficulty: "intermediate" as const,
    text: `Test: Kvadrat tenglamalar asoslari
Fan: Matematika
Bo'lim: Kvadrat tenglamalar

1. $x^2 - 5x + 6 = 0$ tenglamaning ildizlarini toping.
A) $x_1 = 2, x_2 = 3$
B) $x_1 = -2, x_2 = -3$
C) $x_1 = 1, x_2 = 6$
D) $x_1 = -1, x_2 = 5$
Javob: A
Izoh: Viyet teoremasiga ko'ra $x_1 + x_2 = 5$ va $x_1 \\cdot x_2 = 6$. Ildizlar 2 va 3.

2. $x^2 - 16 = 0$ tenglama nechta haqiqiy ildizga ega?
A) 1 ta
B) 2 ta
C) Ildizi yo'q
D) Cheksiz ko'p
Javob: B
Izoh: $x^2 = 16 \\Rightarrow x = \\pm 4$. Tenglama 2 ta ildizga ega.`,
  },
  {
    name: "Fizika: Nyuton qonunlari",
    subject: "Fizika",
    topic: "Dinamika",
    difficulty: "beginner" as const,
    text: `Test: Nyuton qonunlari
Fan: Fizika
Bo'lim: Dinamika

1. Nyutonning 2-qonuni formulasini ko'rsating.
A) $F = m \\cdot a$
B) $E = m \\cdot c^2$
C) $p = m \\cdot v$
D) $A = F \\cdot s$
Javob: A
Izoh: Nyutonning 2-qonuni: Jismga ta'sir etuvchi kuch uning massasi va tezlanishi ko'paytmasiga teng.

2. Kuch birligi qaysi?
A) Joul (J)
B) Nyuton (N)
C) Paskal (Pa)
D) Vatt (W)
Javob: B
Izoh: Xalqaro birliklar sistemasida kuch Nyuton (N) larda o'lchanadi.`,
  },
  {
    name: "Dasturlash: JavaScript & Algoritmlar",
    subject: "Dasturlash",
    topic: "JavaScript Asoslari",
    difficulty: "beginner" as const,
    text: `Test: JavaScript Asoslari
Fan: Dasturlash
Bo'lim: Algoritmlar

1. JavaScript-da o'zgarmas o'zgaruvchi e'lon qilish uchun qaysi kalit so'z ishlatiladi?
A) var
B) let
C) const
D) static
Javob: C
Izoh: 'const' kalit so'zi qayta qiymat berib bo'lmaydigan konstantalarni e'lon qilish uchun xizmat qiladi.

2. '2' + 2 ifodasi qanday natija beradi?
A) 4
B) '22'
C) NaN
D) TypeError
Javob: B
Izoh: Satr va son qo'shilganda JavaScript sonni satrga aylantirib, ularni birlashtiradi (string concatenation).`,
  },
];

const MATH_SNIPPETS = [
  { label: "Kasr (a/b)", code: "\\frac{a}{b}" },
  { label: "Daraja (x²)", code: "x^{2}" },
  { label: "Ildiz (√x)", code: "\\sqrt{x}" },
  { label: "Ko'paytirish (·)", code: "\\cdot" },
  { label: "Teng emas (≠)", code: "\\ne" },
  { label: "Kichik yoki teng (≤)", code: "\\le" },
  { label: "Katta yoki teng (≥)", code: "\\ge" },
  { label: "Integral (∫)", code: "\\int_{a}^{b} f(x)dx" },
  { label: "Pi (π)", code: "\\pi" },
  { label: "Cheksizlik (∞)", code: "\\infty" },
];

export function OpenTestStudio() {
  const [activeTab, setActiveTab] = useState<"paste" | "visual" | "file" | "template">("paste");

  // Asosiy test ma'lumotlari
  const [testTitle, setTestTitle] = useState("Yangi amaliy test");
  const [subjectName, setSubjectName] = useState("Matematika");
  const [topicName, setTopicName] = useState("Umumiy");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [authorName, setAuthorName] = useState("");

  // Matnli kiritish
  const [pasteText, setPasteText] = useState(PRESET_TEMPLATES[0].text);

  // Vizual savollar ro'yxati
  const [visualQuestions, setVisualQuestions] = useState<StudioQuestion[]>([
    {
      id: "q-1",
      prompt: "$x^2 - 5x + 6 = 0$ tenglamaning ildizlarini toping.",
      options: ["$x_1 = 2, x_2 = 3$", "$x_1 = -2, x_2 = -3$", "$x_1 = 1, x_2 = 6$", "$x_1 = -1, x_2 = 5$"],
      correctAnswer: "A",
      explanation: "Viyet teoremasiga ko'ra $x_1 + x_2 = 5$ va $x_1 \\cdot x_2 = 6$. Ildizlar 2 va 3.",
    },
  ]);

  // Faol tanlangan savol (vizual rejim va preview uchun)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Fayl yuklash holati
  const [loadedFileName, setLoadedFileName] = useState("");
  const [fileParsing, setFileParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // Holatlar: Saqlash va Xatoliklar
  const [saving, setSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const [successResult, setSuccessResult] = useState<{
    slug: string;
    title: string;
    questionCount: number;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Matnni avtomatik tahlil qilish (Parsed Questions)
  const parsedPreviewQuestions = useMemo(() => {
    if (activeTab === "visual") {
      return visualQuestions;
    }

    if (!pasteText.trim()) return [];

    try {
      const parsed = parseTeacherContent(pasteText, {
        fallbackTitle: testTitle,
        fallbackTopic: topicName,
        format: "teacher-text",
      });

      const firstTest = parsed.source.tests[0];
      if (!firstTest || !firstTest.questions) return [];

      return firstTest.questions.map((q: ImportQuestion, idx: number) => {
        const rawOptions = (q.options || []).map((opt) => opt.text);
        const correctOpt = typeof q.answer === "string" ? q.answer : q.answer?.correct || "A";
        return {
          id: `parsed-${idx}`,
          prompt: q.body,
          options: rawOptions.length ? rawOptions : ["A", "B", "C", "D"],
          correctAnswer: correctOpt,
          explanation: q.explanation || "",
        };
      });
    } catch {
      return [];
    }
  }, [activeTab, visualQuestions, pasteText, testTitle, topicName]);

  // Savol qo'shish (Vizual rejimda)
  const handleAddQuestion = () => {
    const newQ: StudioQuestion = {
      id: `q-${Date.now()}`,
      prompt: "Yangi savol matnini bu yerga yozing...",
      options: ["Variant A", "Variant B", "Variant C", "Variant D"],
      correctAnswer: "A",
      explanation: "",
    };
    setVisualQuestions((prev) => [...prev, newQ]);
    setActiveQuestionIndex(visualQuestions.length);
  };

  // Savolni o'chirish
  const handleDeleteQuestion = (index: number) => {
    if (visualQuestions.length <= 1) {
      alert("Testda kamida 1 ta savol bo'lishi kerak.");
      return;
    }
    const updated = visualQuestions.filter((_, i) => i !== index);
    setVisualQuestions(updated);
    setActiveQuestionIndex(Math.max(0, index - 1));
  };

  // Formula qo'shish yordamchisi
  const handleInsertFormula = (code: string) => {
    if (activeTab === "paste") {
      setPasteText((prev) => prev + ` $${code}$ `);
    } else {
      setVisualQuestions((prev) => {
        const next = [...prev];
        const current = next[activeQuestionIndex];
        if (current) {
          next[activeQuestionIndex] = {
            ...current,
            prompt: current.prompt + ` $${code}$ `,
          };
        }
        return next;
      });
    }
  };

  // Shablon tanlash
  const handleSelectTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setTestTitle(tpl.name);
    setSubjectName(tpl.subject);
    setTopicName(tpl.topic);
    setDifficulty(tpl.difficulty);
    setPasteText(tpl.text);
    setActiveTab("paste");
  };

  // Fayl yuklash (Word / Excel / CSV / JSON)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setFileParsing(true);
      setErrorNotice("");
      setLoadedFileName(file.name);

      const parsed = await parseTeacherFile(file, topicName);
      const firstTest = parsed.source.tests[0];

      if (firstTest) {
        if (firstTest.title) setTestTitle(firstTest.title);
        if (firstTest.topic) setTopicName(firstTest.topic);

        const newVisuals: StudioQuestion[] = (firstTest.questions || []).map((q, idx) => ({
          id: `file-q-${idx}`,
          prompt: q.body,
          options: (q.options || []).map((opt) => opt.text),
          correctAnswer: typeof q.answer === "string" ? q.answer : q.answer?.correct || "A",
          explanation: q.explanation || "",
        }));

        setVisualQuestions(newVisuals);
        setActiveQuestionIndex(0);
        setActiveTab("visual");
      }
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Faylni o'qishda xatolik yuz berdi.");
    } finally {
      setFileParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Testni Platformaga Saqlash & E'lon Qilish
  const handlePublishTest = async () => {
    try {
      setSaving(true);
      setErrorNotice("");

      const questionsToPublish = activeTab === "visual" ? visualQuestions : parsedPreviewQuestions;

      if (!questionsToPublish.length) {
        throw new Error("Testda kamida bitta to'liq savol bo'lishi kerak. Iltimos, savollarni kiriting.");
      }

      const cleanSlug =
        testTitle
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 45) + `-${Date.now().toString(36).slice(-4)}`;

      const creatorCode = getCreatorCode();
      const author = authorName.trim() || "QuestLab Creator";

      // 1-bosqich: Mavjud fan va bo'limlarni tekshirish yoki birlamchi fanga ulash
      const subjectsList = await questApi.subjects().catch(() => []);
      const activeSubject =
        subjectsList.find((s) => s.title.toLowerCase() === subjectName.toLowerCase()) ||
        subjectsList[0] ||
        { id: 1, title: subjectName || "Matematika", slug: "matematika" };

      const topicsList = await questApi.topics(activeSubject.slug).catch(() => []);
      const activeTopic =
        topicsList.find((t) => t.title.toLowerCase() === topicName.toLowerCase()) ||
        topicsList[0] ||
        { id: 1, title: topicName || "Umumiy", slug: "umumiy" };

      // 2-bosqich: Savollarni API formatiga moslashtirish
      const apiQuestions = questionsToPublish.map((q) => {
        const optionList = q.options.length ? q.options : ["A", "B", "C", "D"];
        let resolvedAnswer = q.correctAnswer;

        // Agar A, B, C, D harfida bo'lsa, tegishli matnga almashtiramiz yoki harfni saqlaymiz
        const letterIndex = ["A", "B", "C", "D", "E", "F"].indexOf(q.correctAnswer.toUpperCase());
        if (letterIndex >= 0 && optionList[letterIndex]) {
          resolvedAnswer = optionList[letterIndex];
        }

        return {
          type: "single_choice" as const,
          prompt: q.prompt,
          options: optionList,
          answer: resolvedAnswer,
          explanation: q.explanation || "To'g'ri javob: " + resolvedAnswer,
          skills: [],
        };
      });

      // 3-bosqich: Testni yaratish
      const createdTest = await questApi.createTest({
        title: testTitle,
        slug: cleanSlug,
        subject: activeSubject.id,
        topic: activeTopic.id,
        difficulty,
        estimated_minutes: timeLimitMinutes,
        passing_score: 60,
        status: "published",
        creator_name: author,
        creator_code: creatorCode,
        questions: apiQuestions,
      });

      setSuccessResult({
        slug: createdTest.slug,
        title: createdTest.title,
        questionCount: apiQuestions.length,
      });
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Testni saqlashda xatolik yuz berdi. Backend ulanishini tekshiring.");
    } finally {
      setSaving(false);
    }
  };

  const currentPreviewQuestion =
    parsedPreviewQuestions[activeQuestionIndex] || parsedPreviewQuestions[0];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Yuqori Sarlavha & Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-black/8 bg-gradient-to-br from-white via-surface-soft to-amber-50/40 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles className="size-3.5" /> Ochiq Test Studiyasi
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Istalgan kishi uchun test yaratish markazi
          </h1>
          <p className="mt-1 text-sm text-ink/65">
            Ro&apos;yxatdan o&apos;tish shart emas! Matnni shunchaki qo&apos;ying, fayl yuklang yoki vizual konstruktordan foydalaning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePublishTest}
            disabled={saving || !parsedPreviewQuestions.length}
            className="inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-brand hover:shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Nashr qilinmoqda...
              </span>
            ) : (
              <>
                <Save className="size-4" />
                Testni e&apos;lon qilish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Xatolik ogohlantirishi */}
      {errorNotice && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-sm">
          {errorNotice}
        </div>
      )}

      {/* Muvaffaqiyatli saqlanganda Modal/Card */}
      {successResult && (
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50/80 p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Muvaffaqiyatli e&apos;lon qilindi!
                </span>
                <h3 className="text-xl font-bold text-ink">{successResult.title}</h3>
                <p className="text-xs text-ink/65">
                  Test bazaga qo&apos;shildi va {successResult.questionCount} ta savol barcha foydalanuvchilar uchun ochiq.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/tests/${successResult.slug}`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copiedLink ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                {copiedLink ? "Havola nusxalandi!" : "Havolani nusxalash"}
              </button>
              <Link
                href={`/tests/${successResult.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand"
              >
                <ExternalLink className="size-4" />
                Testni hozir boshlash
              </Link>
              <button
                type="button"
                onClick={() => setSuccessResult(null)}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-ink/60 hover:text-ink"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asosiy Ish Maydoni (2 ustunli: Chapda kiritish, O'ngda jonli preview) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Chap qism: Sozlamalar va Kiritish Rejimlari (7 ustun) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Test meta ma'lumotlari kartochkasi */}
          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">
              1. Test Haqida Asosiy Ma&apos;lumotlar
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-ink">Test Sarlavhasi</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Masalan: Kvadrat tenglamalar bo'yicha nazorat testi"
                  className="mt-1 w-full rounded-2xl border border-black/15 bg-surface-soft px-4 py-2.5 text-sm font-medium text-ink focus:border-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Fan (Subject)</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Masalan: Matematika, Fizika..."
                  className="mt-1 w-full rounded-2xl border border-black/15 bg-surface-soft px-4 py-2 text-sm font-medium text-ink focus:border-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Mavzu / Bo&apos;lim (Topic)</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="Masalan: Tenglamalar"
                  className="mt-1 w-full rounded-2xl border border-black/15 bg-surface-soft px-4 py-2 text-sm font-medium text-ink focus:border-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Qiyinlik Darajasi</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")}
                  className="mt-1 w-full rounded-2xl border border-black/15 bg-surface-soft px-3.5 py-2 text-sm font-medium text-ink focus:border-ink focus:bg-white focus:outline-none"
                >
                  <option value="beginner">Boshlang&apos;ich (Beginner)</option>
                  <option value="intermediate">O&apos;rta (Intermediate)</option>
                  <option value="advanced">Murakkab (Advanced)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Vaqt chegarasi (daqiqa)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-black/15 bg-surface-soft px-4 py-2 text-sm font-medium text-ink focus:border-ink focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-ink">Muallif / O&apos;qituvchi Ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ismingiz yoki repetitorlik markazingiz nomi"
                  className="mt-1 w-full rounded-2xl border border-black/15 bg-surface-soft px-4 py-2 text-sm font-medium text-ink focus:border-ink focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Test Kiritish Usullari (Tablar) */}
          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">
                  2. Savollarni Kiritish
                </h2>
                <p className="text-xs text-ink/60">Sizga qulay bo&apos;lgan istalgan usulni tanlang</p>
              </div>

              {/* Tab Selector */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-surface-soft p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("paste")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                    activeTab === "paste" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink",
                  )}
                >
                  <ClipboardPaste className="size-3.5" />
                  Tezkor Matn
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("visual")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                    activeTab === "visual" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink",
                  )}
                >
                  <Sliders className="size-3.5" />
                  Konstruktor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("file")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                    activeTab === "file" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink",
                  )}
                >
                  <FileUp className="size-3.5" />
                  Fayl Yuklash
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("template")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                    activeTab === "template" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink",
                  )}
                >
                  <Sparkles className="size-3.5" />
                  Namunalar
                </button>
              </div>
            </div>

            {/* LaTeX Formulalar Paneli (Doim qulay bo'lishi uchun) */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-black/8 bg-surface-soft/60 p-2.5">
              <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mr-1">
                Formula yordamchisi:
              </span>
              {MATH_SNIPPETS.map((snippet) => (
                <button
                  key={snippet.label}
                  type="button"
                  onClick={() => handleInsertFormula(snippet.code)}
                  className="rounded-lg border border-black/8 bg-white px-2 py-1 text-[11px] font-mono text-ink/80 transition hover:bg-ink hover:text-white"
                  title={snippet.label}
                >
                  {snippet.label}
                </button>
              ))}
            </div>

            {/* 1-TAB: Tezkor Matn (Paste) */}
            {activeTab === "paste" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-ink/60">
                  <span>Matnni xohlagan tartibda tashlang (Savol, Variantlar A, B, C, D, Javob, Izoh):</span>
                  <span className="font-semibold text-emerald-700">
                    {parsedPreviewQuestions.length} ta savol ajratildi
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="1. Savol matni...&#10;A) Variant 1&#10;B) Variant 2&#10;C) Variant 3&#10;D) Variant 4&#10;Javob: A&#10;Izoh: Tushuntirish..."
                  className="w-full rounded-2xl border border-black/15 bg-surface-soft p-4 font-mono text-xs leading-relaxed text-ink focus:border-ink focus:bg-white focus:outline-none"
                />
              </div>
            )}

            {/* 2-TAB: Interaktiv Vizual Konstruktor */}
            {activeTab === "visual" && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-ink/60">
                    Savol {activeQuestionIndex + 1} / {visualQuestions.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand"
                    >
                      <Plus className="size-3.5" />
                      Yangi savol
                    </button>
                    {visualQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(activeQuestionIndex)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                        title="Savolni o'chirish"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Savol navigatsiyasi (Pill lar) */}
                <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                  {visualQuestions.map((q, idx) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={cn(
                        "size-8 rounded-xl text-xs font-bold transition",
                        activeQuestionIndex === idx
                          ? "bg-ink text-white shadow-sm"
                          : "border border-black/10 bg-surface-soft text-ink/70 hover:bg-black/5",
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Joriy Savol Tahrirlash Formasi */}
                {visualQuestions[activeQuestionIndex] && (
                  <div className="space-y-4 rounded-2xl border border-black/8 bg-surface-soft/40 p-4">
                    <div>
                      <label className="text-xs font-bold text-ink">Savol Matni</label>
                      <textarea
                        rows={3}
                        value={visualQuestions[activeQuestionIndex].prompt}
                        onChange={(e) => {
                          const updated = [...visualQuestions];
                          updated[activeQuestionIndex].prompt = e.target.value;
                          setVisualQuestions(updated);
                        }}
                        className="mt-1 w-full rounded-xl border border-black/15 bg-white p-3 text-xs text-ink focus:border-ink focus:outline-none"
                      />
                    </div>

                    {/* Variantlar */}
                    <div>
                      <label className="text-xs font-bold text-ink">Javob Variantlari (To&apos;g&apos;risini belgilang)</label>
                      <div className="mt-2 space-y-2">
                        {["A", "B", "C", "D"].map((letter, optIdx) => {
                          const currentOpt = visualQuestions[activeQuestionIndex].options[optIdx] || "";
                          const isCorrect = visualQuestions[activeQuestionIndex].correctAnswer === letter;

                          return (
                            <div key={letter} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...visualQuestions];
                                  updated[activeQuestionIndex].correctAnswer = letter;
                                  setVisualQuestions(updated);
                                }}
                                className={cn(
                                  "grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold transition",
                                  isCorrect ? "bg-emerald-600 text-white shadow-sm" : "border border-black/15 bg-white text-ink/70 hover:bg-black/5",
                                )}
                                title={`Variant ${letter} ni to'g'ri deb belgilash`}
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                value={currentOpt}
                                onChange={(e) => {
                                  const updated = [...visualQuestions];
                                  const opts = [...updated[activeQuestionIndex].options];
                                  opts[optIdx] = e.target.value;
                                  updated[activeQuestionIndex].options = opts;
                                  setVisualQuestions(updated);
                                }}
                                placeholder={`Variant ${letter}...`}
                                className={cn(
                                  "w-full rounded-xl border px-3 py-1.5 text-xs focus:outline-none",
                                  isCorrect ? "border-emerald-500 bg-emerald-50/30" : "border-black/15 bg-white",
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Yechim va Izoh */}
                    <div>
                      <label className="text-xs font-bold text-ink">Tushuntirish va Yechim (Izoh)</label>
                      <textarea
                        rows={2}
                        value={visualQuestions[activeQuestionIndex].explanation}
                        onChange={(e) => {
                          const updated = [...visualQuestions];
                          updated[activeQuestionIndex].explanation = e.target.value;
                          setVisualQuestions(updated);
                        }}
                        placeholder="Ushbu savol qanday yechiladi yoki qaysi qoida qo'llaniladi..."
                        className="mt-1 w-full rounded-xl border border-black/15 bg-white p-3 text-xs text-ink focus:border-ink focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3-TAB: Fayl Yuklash */}
            {activeTab === "file" && (
              <div className="mt-4 space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/20 bg-surface-soft p-8 text-center transition hover:border-ink hover:bg-black/[0.02]"
                >
                  <div className="grid size-14 place-items-center rounded-2xl bg-white shadow-sm text-ink">
                    <FileUp className="size-7" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-ink">
                    Faylni bu yerga sudrab tashlang yoki bosing
                  </h4>
                  <p className="mt-1 text-xs text-ink/60">
                    Qo&apos;llab-quvvatlanadi: Word (.docx), Excel (.xlsx), CSV, JSON, TXT
                  </p>
                  <label htmlFor={fileInputId} className="sr-only">Test faylini tanlang</label>
                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.xlsx,.xls,.csv,.json,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {fileParsing && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink/70">
                    <span className="size-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                    Fayl tahlil qilinmoqda...
                  </div>
                )}

                {loadedFileName && !fileParsing && (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                    <span>Yuklangan fayl: {loadedFileName}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("visual")}
                      className="inline-flex items-center gap-1 underline hover:text-emerald-950"
                    >
                      Konstruktorda ko&apos;rish <ArrowRight className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4-TAB: Tayyor Namunalar */}
            {activeTab === "template" && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-ink/65">
                  Quyidagi tayyor shablonlardan birini tanlang va bir zumda o&apos;zgartiring:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PRESET_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="flex flex-col justify-between rounded-2xl border border-black/10 bg-surface-soft p-4 text-left transition hover:border-ink hover:bg-white shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                            {tpl.subject}
                          </span>
                          <span className="text-[10px] text-ink/50">{tpl.topic}</span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-ink">{tpl.name}</h4>
                      </div>
                      <span className="mt-3 text-xs font-semibold text-brand flex items-center gap-1">
                        Shablonni yuklash <ArrowRight className="size-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* O'ng qism: Jonli Talaba Ko'rinishi (Live Student Preview - 5 ustun) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sticky top-24 rounded-3xl border border-black/10 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-black/8 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
                  Jonli Oldindan Ko&apos;rish (Preview)
                </span>
              </div>
              <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[11px] font-bold text-ink/60">
                {parsedPreviewQuestions.length} ta savol
              </span>
            </div>

            {/* Test Headeri preview */}
            <div className="mt-4 rounded-2xl bg-surface-soft p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                {subjectName || "Fan"} • {topicName || "Mavzu"}
              </span>
              <h3 className="mt-1 text-base font-bold text-ink">{testTitle || "Test nomi"}</h3>
              <div className="mt-2 flex items-center gap-3 text-xs text-ink/60">
                <span>⏱️ {timeLimitMinutes} daqiqa</span>
                <span>📊 {difficulty}</span>
              </div>
            </div>

            {/* Savol kartochkasi preview */}
            {currentPreviewQuestion ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="text-xs font-bold text-ink/45">
                    Savol {activeQuestionIndex + 1}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-ink leading-relaxed">
                    <LatexText text={currentPreviewQuestion.prompt} />
                  </div>

                  {/* Variantlar */}
                  <div className="mt-4 space-y-2">
                    {currentPreviewQuestion.options.map((opt, optIndex) => {
                      const letter = ["A", "B", "C", "D", "E", "F"][optIndex] || `${optIndex + 1}`;
                      const isCorrect =
                        currentPreviewQuestion.correctAnswer === letter ||
                        currentPreviewQuestion.correctAnswer === opt;

                      return (
                        <div
                          key={letter}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 text-xs transition",
                            isCorrect
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium"
                              : "border-black/8 bg-surface-soft/60 text-ink/80",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-lg text-xs font-bold",
                              isCorrect ? "bg-emerald-600 text-white" : "bg-black/10 text-ink/70",
                            )}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">
                            <LatexText text={opt} />
                          </span>
                          {isCorrect && (
                            <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              To&apos;g&apos;ri javob
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Izoh / Explanation */}
                  {currentPreviewQuestion.explanation && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lightbulb className="size-3.5 text-amber-600" />
                        Tushuntirish:
                      </div>
                      <div className="mt-1">
                        <LatexText text={currentPreviewQuestion.explanation} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Savollarni oldinga/orqaga o'tkazish */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={activeQuestionIndex === 0}
                    onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-black/5 disabled:opacity-30"
                  >
                    Oldingi savol
                  </button>
                  <button
                    type="button"
                    disabled={activeQuestionIndex >= parsedPreviewQuestions.length - 1}
                    onClick={() => setActiveQuestionIndex((prev) => Math.min(parsedPreviewQuestions.length - 1, prev + 1))}
                    className="rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-black/5 disabled:opacity-30"
                  >
                    Keyingi savol
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-8 text-center text-xs text-ink/50">
                Savollar kiritilgach, ular bu yerda chiroyli ko&apos;rinishda namoyish etiladi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
