"use client";

import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  ApiQuestion,
  ApiSkill,
  ApiSubject,
  ApiTest,
  ApiTopic,
  CreateTestQuestionPayload,
} from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { LatexText } from "@/shared/ui/latex-text";

const blankQuestion = (): CreateTestQuestionPayload => ({
  type: "single_choice",
  prompt: "Solve \\(2x + 3 = 11\\).",
  options: ["\\(x = 2\\)", "\\(x = 4\\)", "\\(x = 7\\)", "\\(x = 11\\)"],
  answer: "\\(x = 4\\)",
  explanation: "Subtract 3 from both sides: \\(2x = 8\\), then divide by 2.",
  skills: [],
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

type Props = {
  subjects: ApiSubject[];
  topics: ApiTopic[];
  tests: ApiTest[];
  skills: ApiSkill[];
};

export function TestCrudForm({ subjects, topics, tests: initialTests, skills }: Props) {
  const defaultSubject = subjects.find((subject) => subject.slug === "mathematics") ?? subjects[0];
  const defaultTopic = topics.find((topic) => topic.slug === "algebra") ?? topics[0];
  const [subjectId, setSubjectId] = useState(defaultSubject?.id ?? 0);
  const [topicId, setTopicId] = useState(defaultTopic?.id ?? 0);
  const [difficulty, setDifficulty] = useState<ApiTest["difficulty"]>("beginner");
  const [status, setStatus] = useState<ApiTest["status"]>("published");
  const [title, setTitle] = useState("Custom Algebra Test");
  const [slug, setSlug] = useState("custom-algebra-test");
  const [minutes, setMinutes] = useState(10);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<CreateTestQuestionPayload[]>([blankQuestion(), blankQuestion()]);
  const [createdTest, setCreatedTest] = useState<ApiTest | null>(null);
  const [tests, setTests] = useState(initialTests);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const visibleTopics = useMemo(
    () => topics.filter((topic) => topic.subject === subjectId),
    [subjectId, topics],
  );
  const visibleSkills = useMemo(() => skills.filter((skill) => skill.topic === topicId), [skills, topicId]);

  function updateQuestion(index: number, patch: Partial<CreateTestQuestionPayload>) {
    setQuestions((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    setCreatedTest(null);
    if (questions.some((question) => question.skills.length === 0)) {
      setError("Har bir savol kamida bitta skillga bog‘lanishi kerak.");
      setSaving(false);
      return;
    }
    try {
      const test = editingSlug
        ? await questApi.updateTest(editingSlug, {
            title,
            subject: subjectId,
            topic: topicId,
            difficulty,
            estimated_minutes: minutes,
            passing_score: passingScore,
            status,
            questions: questions.map((question) => ({
              ...question,
              options: question.options.filter(Boolean),
            })),
          })
        : await questApi.createTest({
        title,
        slug: slugify(slug || title),
        subject: subjectId,
        topic: topicId,
        difficulty,
        estimated_minutes: minutes,
        passing_score: passingScore,
        status,
        questions: questions.map((question) => ({
          ...question,
          options: question.options.filter(Boolean),
        })),
      });
      setCreatedTest(test);
      setTests((items) => [test, ...items.filter((item) => item.slug !== test.slug)]);
      setEditingSlug(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test yaratishda xatolik boldi.");
    } finally {
      setSaving(false);
    }
  }

  function editTest(test: ApiTest) {
    setEditingSlug(test.slug);
    setTitle(test.title);
    setSlug(test.slug);
    setSubjectId(test.subject);
    setTopicId(test.topic);
    setDifficulty(test.difficulty);
    setStatus(test.status);
    setMinutes(test.estimated_minutes);
    setPassingScore(test.passing_score);
    setQuestions(test.test_questions.map((item) => ({
      type: item.question.type,
      prompt: item.question.prompt,
      options: item.question.options,
      answer: item.question.answer,
      explanation: item.question.explanation,
      skills: item.question.skills,
    })));
  }

  async function removeTest(test: ApiTest) {
    try {
      const deleted = await questApi.deleteTest(test.slug);
      if (deleted) {
        setTests((items) => items.map((item) => (item.slug === test.slug ? deleted : item)));
      } else {
        setTests((items) => items.filter((item) => item.slug !== test.slug));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">CRUD</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#151713]">{editingSlug ? "Test edit" : "Test qoshish"}</h1>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !subjectId || !topicId}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? "Saqlanyapti..." : editingSlug ? "Update" : "DBga saqla"}
          </button>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Test nomi
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setSlug(slugify(event.target.value));
              }}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Slug
            <input
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Fan
            <select
              value={subjectId}
              onChange={(event) => {
                const nextSubjectId = Number(event.target.value);
                const firstTopic = topics.find((topic) => topic.subject === nextSubjectId);
                setSubjectId(nextSubjectId);
                setTopicId(firstTopic?.id ?? 0);
              }}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Bolim
            <select
              value={topicId}
              onChange={(event) => setTopicId(Number(event.target.value))}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
            >
              {visibleTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Daraja
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as ApiTest["difficulty"])}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ApiTest["status"])}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-semibold text-black/65">
              Vaqt
              <input
                type="number"
                min={1}
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-black/65">
              Passing %
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(event) => setPassingScore(Number(event.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
              />
            </label>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {questions.map((question, index) => (
            <article key={index} className="rounded-3xl border border-black/8 bg-[#fbfbf6] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Savol {index + 1}</h2>
                <button
                  type="button"
                  onClick={() => setQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                  className="grid size-9 place-items-center rounded-xl border border-black/10 bg-white text-black/55 hover:text-red-600"
                  aria-label="Remove question"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-black/65">
                  Savol matni LaTeX bilan
                  <textarea
                    value={question.prompt}
                    onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                    rows={3}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-black/65">
                  Variantlar, har qatorda bittadan
                  <textarea
                    value={question.options.join("\n")}
                    onChange={(event) => updateQuestion(index, { options: event.target.value.split("\n") })}
                    rows={4}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-black/65">
                    Togri javob
                    <input
                      value={question.answer}
                      onChange={(event) => updateQuestion(index, { answer: event.target.value })}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-black/65">
                    Savol turi
                    <select
                      value={question.type}
                      onChange={(event) => updateQuestion(index, { type: event.target.value as ApiQuestion["type"] })}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
                    >
                      <option value="single_choice">Single choice</option>
                      <option value="multiple_choice">Multiple choice</option>
                      <option value="short_answer">Short answer</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-semibold text-black/65">
                  Tushuntirish
                  <textarea
                    value={question.explanation}
                    onChange={(event) => updateQuestion(index, { explanation: event.target.value })}
                    rows={3}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-black/65">
                  Skills
                  <select
                    multiple
                    value={question.skills.map(String)}
                    onChange={(event) =>
                      updateQuestion(index, {
                        skills: Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                      })
                    }
                    className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/30"
                  >
                    {visibleSkills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.title}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-medium text-black/45">Ctrl/Command bilan bir nechta skill tanlang.</span>
                </label>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setQuestions((items) => [...items, blankQuestion()])}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/70 hover:bg-[#f3f3ec]"
        >
          <Plus className="size-4" />
          Savol qoshish
        </button>

        {error ? <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {createdTest ? (
          <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Test saqlandi.{" "}
            <Link className="underline" href={`/tests/${createdTest.slug}`}>
              Test sahifasini ochish
            </Link>
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-black/8 bg-white/70 p-4">
          <h2 className="text-xl font-semibold">Existing tests</h2>
          <div className="mt-4 grid gap-3">
            {tests.slice(0, 12).map((test) => (
              <div key={test.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white p-4">
                <div>
                  <p className="font-semibold">{test.title}</p>
                  <p className="mt-1 text-sm text-black/50">{test.difficulty} / {test.status} / {test.test_questions.length} questions</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editTest(test)} className="grid size-10 place-items-center rounded-xl border border-black/10 hover:bg-[#f3f3ec]" aria-label="Edit test">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => removeTest(test)} className="grid size-10 place-items-center rounded-xl border border-black/10 text-red-600 hover:bg-red-50" aria-label="Delete test">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="rounded-[28px] border border-black/8 bg-white/70 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.08)] lg:sticky lg:top-24 lg:h-fit">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Preview</p>
        <h2 className="mt-2 text-2xl font-semibold">{title || "Untitled test"}</h2>
        <p className="mt-2 text-sm text-black/52">
          {difficulty} · {minutes} min · {questions.length} savol
        </p>
        <div className="mt-5 space-y-3">
          {questions.map((question, index) => (
            <div key={index} className={cn("rounded-2xl border border-black/8 bg-white p-4", index > 2 && "hidden")}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/36">Question {index + 1}</p>
              <div className="mt-2 text-sm font-semibold">
                <LatexText text={question.prompt} />
              </div>
              <div className="mt-3 grid gap-2">
                {question.options.filter(Boolean).slice(0, 4).map((option) => (
                  <div key={option} className="rounded-xl border border-black/8 px-3 py-2 text-sm text-black/65">
                    <LatexText text={option} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
