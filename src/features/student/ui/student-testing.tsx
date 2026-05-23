"use client";

import { ArrowLeft, ArrowRight, Flag, Search, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ApiExamPack, ApiExamPackItem, ApiMistakesSummary, ApiProfileSummary, ApiSession, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getStudentCode } from "@/shared/model/local-identity";
import { LatexText } from "@/shared/ui/latex-text";

type TestStatus = "assigned" | "in_progress" | "completed" | "available";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}

function scoreSession(session: ApiSession, test: ApiTest) {
  const answers = new Map(session.answers.map((answer) => [answer.question, answer.value]));
  const questions = test.test_questions.map((item) => item.question);
  const correct = questions.filter((question) => normalize(question.answer) === normalize(answers.get(question.id) ?? "")).length;
  const answered = questions.filter((question) => answers.get(question.id)).length;
  const wrong = Math.max(0, answered - correct);
  const skipped = Math.max(0, questions.length - answered);
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return { correct, wrong, skipped, answered, total: questions.length, score };
}

function testSkills(test: ApiTest) {
  return Array.from(new Set(test.test_questions.flatMap((item) => item.question.skill_titles))).slice(0, 5);
}

export function StudentDashboard({ summary, tests, packs, sessions }: { summary: ApiProfileSummary; tests: ApiTest[]; packs: ApiExamPack[]; sessions: ApiSession[] }) {
  const inProgress = sessions.find((item) => item.status === "in_progress");
  const weakTopics = summary.topic_progress.filter((item) => item.value < 70);
  return (
    <StudentShell eyebrow="Student" title="Home" copy="Test ishlash, xatolar va progress uchun ixcham ish paneli.">
      <SummaryGrid stats={[
        ["Pending tests", packs.filter((pack) => pack.is_active).length],
        ["Completed tests", summary.tests_taken],
        ["Average score", `${summary.average_score}%`],
        ["Weak topics", weakTopics.length],
      ]} />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Section title="Continue test">
          {inProgress ? <CompactCard title={inProgress.test_title} meta="In progress" href={`/student/test-session/${inProgress.id}`} action="Continue" stats={[`${inProgress.answers.length} answered`]} /> : <Empty text="Davom ettiriladigan test yo'q." />}
        </Section>
        <Section title="Recommended next action">
          <CompactCard title={weakTopics[0]?.topic ?? "Available tests"} meta={weakTopics[0] ? `${weakTopics[0].value}% mastery` : "Start practice"} href={weakTopics[0] ? "/student/mistakes" : "/student/tests"} action={weakTopics[0] ? "Review" : "Open"} stats={weakTopics[0] ? [`${weakTopics[0].attempts} attempts`] : [`${tests.length} tests`]} />
        </Section>
      </div>
      <Section title="Assigned packs">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packs.filter((pack) => pack.is_active).slice(0, 6).map((pack) => <PackCard key={pack.id} pack={pack} />)}
        </div>
      </Section>
      <Section title="Recent results">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summary.recent_tests.map((item) => <CompactCard key={item.id} title={item.title} meta={item.topic} href={`/student/results/${item.id}`} action="View result" stats={[`${item.score}%`, `${item.correct}/${item.total}`]} />)}
          {!summary.recent_tests.length ? <Empty text="Hali natija yo'q." /> : null}
        </div>
      </Section>
    </StudentShell>
  );
}

export function StudentTestsWorkspace({ tests, packs, sessions }: { tests: ApiTest[]; packs: ApiExamPack[]; sessions: ApiSession[] }) {
  const [tab, setTab] = useState<TestStatus>("available");
  const completed = new Set(sessions.filter((item) => item.status === "submitted").map((item) => item.test_slug));
  const inProgress = new Set(sessions.filter((item) => item.status === "in_progress").map((item) => item.test_slug));
  const filtered = tests.filter((test) => {
    if (tab === "completed") return completed.has(test.slug);
    if (tab === "in_progress") return inProgress.has(test.slug);
    if (tab === "assigned") return false;
    return test.status === "published";
  });
  return (
    <StudentShell eyebrow="Student" title="Tests" copy="Assigned, in progress, completed va available testlar.">
      <Tabs value={tab} onChange={setTab} items={["assigned", "in_progress", "completed", "available"]} />
      {tab === "assigned" ? (
        <Section title="Assigned packs">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{packs.filter((pack) => pack.is_active).map((pack) => <PackCard key={pack.id} pack={pack} />)}</div>
        </Section>
      ) : (
        <Section title={`${tab.replace("_", " ")} tests`}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((test) => <TestCard key={test.id} test={test} status={completed.has(test.slug) ? "completed" : inProgress.has(test.slug) ? "in_progress" : "available"} session={sessions.find((item) => item.test_slug === test.slug)} />)}
            {!filtered.length ? <Empty text="Bu bo'limda test yo'q." /> : null}
          </div>
        </Section>
      )}
    </StudentShell>
  );
}

export function StudentPackDetail({ pack, items, results }: { pack: ApiExamPack; items: ApiExamPackItem[]; results?: { attempts: number; students_submitted: number; average_score: number; item_stats: Array<{ item_id: number; attempts: number; average_score: number }> } | null }) {
  const completed = results?.item_stats.filter((item) => item.attempts > 0).length ?? 0;
  return (
    <StudentShell eyebrow="Pack" title={pack.title} copy={pack.description || "Tayyor test pack."}>
      <SummaryGrid stats={[
        ["Subject", pack.exam_type || "General"],
        ["Level", "Pack"],
        ["Tests", items.length],
        ["Completed", completed],
        ["Average score", `${results?.average_score ?? 0}%`],
        ["Due date", "No due date"],
      ]} />
      <Section title="Test list">
        <div className="grid gap-4">
          {items.map((item) => {
            const stat = results?.item_stats.find((row) => row.item_id === item.id);
            return (
              <div key={item.id} className="grid gap-3 rounded-xl border border-black/8 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge>{stat?.attempts ? "completed" : "available"}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-black/55">{item.difficulty} / {item.question_count} questions / skills-based test</p>
                </div>
                <div className="flex items-center gap-2">
                  {stat?.attempts ? <span className="text-sm font-semibold text-black/55">{stat.average_score}%</span> : null}
                  <Link href={`/student/tests/${item.test_slug}`} className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">{stat?.attempts ? "View result" : "Start"}</Link>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </StudentShell>
  );
}

export function StudentTestInstructions({ test, session }: { test: ApiTest; session?: ApiSession }) {
  const status = session?.status ?? "available";
  const skills = testSkills(test);
  return (
    <StudentShell eyebrow="Test" title={test.title} copy={`${test.subject_slug} / ${test.topic_slug}`}>
      <SummaryGrid stats={[
        ["Subject", test.subject_slug],
        ["Topic", test.topic_slug],
        ["Level", test.difficulty],
        ["Questions", test.test_questions.length],
        ["Time limit", `${test.estimated_minutes} min`],
        ["Attempt limit", "1+"],
        ["Due date", "No due date"],
        ["Status", status],
      ]} />
      <Section title="Skill focus">
        <div className="rounded-xl border border-black/8 bg-white p-4">
          <p className="line-clamp-2 text-sm leading-6 text-black/60">Bu test quyidagi skilllarni tekshiradi: {skills.length ? skills.join(", ") : "asosiy mavzu tushunchalari"}.</p>
          <p className="mt-3 text-sm text-black/52">Savollar va to&apos;g&apos;ri javoblar submit qilinmaguncha ko&apos;rsatilmaydi.</p>
          <div className="mt-4">
            {status === "submitted" && session ? <Link href={`/student/results/${session.id}`} className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">View result</Link> : status === "in_progress" && session ? <Link href={`/student/test-session/${session.id}`} className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Continue</Link> : <Link href={`/student/tests/${test.slug}/start`} className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Start</Link>}
          </div>
        </div>
      </Section>
    </StudentShell>
  );
}

export function StudentActiveSession({ initialSession, test }: { initialSession: ApiSession; test: ApiTest }) {
  const router = useRouter();
  const questions = test.test_questions.map((item) => item.question);
  const [session, setSession] = useState(initialSession);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const question = questions[index];
  const answerMap = useMemo(() => new Map(session.answers.map((answer) => [answer.question, answer])), [session.answers]);
  const current = answerMap.get(question.id);
  const answered = questions.filter((item) => answerMap.get(item.id)?.value).length;
  const elapsed = Math.max(0, Math.floor((now - new Date(session.created_at).getTime()) / 1000));
  const remaining = Math.max(0, test.estimated_minutes * 60 - elapsed);
  const timer = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  async function save(value: string, flagged = current?.is_flagged ?? false) {
    const next = await questApi.answer(String(session.id), { question: question.id, value, is_flagged: flagged });
    setSession(next);
  }

  async function submit() {
    await questApi.submit(String(session.id));
    router.push(`/student/results/${session.id}`);
  }

  return (
    <StudentShell eyebrow="Active test" title={test.title} copy="Timer, navigator va javoblar backendda saqlanadi.">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-black/8 bg-white p-4">
          <div className="flex items-center gap-2 rounded-xl bg-[#151713] px-3 py-2 text-sm font-semibold text-white"><Timer className="size-4" />{timer}</div>
          <p className="mt-3 text-sm font-semibold">{answered}/{questions.length} answered</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((item, itemIndex) => (
              <button key={item.id} onClick={() => setIndex(itemIndex)} className={cn("rounded-lg border px-2 py-2 text-sm font-semibold", itemIndex === index ? "border-[#151713] bg-[#151713] text-white" : answerMap.get(item.id)?.value ? "border-[#276a5b]/30 bg-[#edf7f3] text-[#276a5b]" : "border-black/10 bg-[#fbfbf6]")}>{itemIndex + 1}</button>
            ))}
          </div>
          <button onClick={submit} className="mt-4 w-full rounded-xl bg-[#276a5b] px-4 py-2 text-center text-sm font-semibold text-white">Submit</button>
        </div>
        <div className="rounded-xl border border-black/8 bg-white p-4">
          <div className="flex items-center justify-between gap-3 border-b border-black/8 pb-3">
            <p className="text-sm font-semibold text-[#276a5b]">Question {index + 1} / {questions.length}</p>
            <button onClick={() => save(current?.value ?? "", !(current?.is_flagged ?? false))} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold"><Flag className="size-4" />Flag</button>
          </div>
          <div className="mt-5 text-lg leading-8"><LatexText text={question.prompt} /></div>
          {question.options.length ? (
            <div className="mt-5 grid gap-3">
              {question.options.map((option, optionIndex) => (
                <button key={option} onClick={() => save(option)} className={cn("flex items-start gap-3 rounded-xl border p-4 text-left text-sm", current?.value === option ? "border-[#276a5b] bg-[#edf7f3]" : "border-black/10 bg-[#fbfbf6]")}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold">{String.fromCharCode(65 + optionIndex)}</span>
                  <LatexText text={option} />
                </button>
              ))}
            </div>
          ) : <input value={current?.value ?? ""} onChange={(event) => save(event.target.value)} className="mt-5 w-full rounded-xl border border-black/10 bg-[#fbfbf6] px-4 py-3 text-sm outline-none" placeholder="Answer" />}
          <div className="mt-5 flex justify-between gap-3">
            <button onClick={() => setIndex((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold"><ArrowLeft className="size-4" />Previous</button>
            <button onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} className="inline-flex items-center gap-2 rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Next<ArrowRight className="size-4" /></button>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}

export function StudentResult({ session, test }: { session: ApiSession; test: ApiTest }) {
  const stats = scoreSession(session, test);
  const mistakes = test.test_questions.map((item) => item.question).filter((question) => normalize(question.answer) !== normalize(session.answers.find((answer) => answer.question === question.id)?.value ?? ""));
  const skills = Array.from(new Set(mistakes.flatMap((question) => question.skill_titles))).slice(0, 6);
  return (
    <StudentShell eyebrow="Result" title={test.title} copy="Score, breakdown, weak skills va keyingi qadamlar.">
      <SummaryGrid stats={[["Score", `${stats.score}%`], ["Correct", stats.correct], ["Wrong", stats.wrong], ["Skipped", stats.skipped], ["Time spent", "Session time"], ["Weak skills", skills.length]]} />
      <Section title="Weak skills">
        <div className="grid gap-3 md:grid-cols-3">{skills.map((skill) => <CompactCard key={skill} title={skill} meta="Review needed" href="/student/mistakes" action="Review" />)}{!skills.length ? <Empty text="Weak skill topilmadi." /> : null}</div>
      </Section>
      <Section title="Mistake list">
        <div className="grid gap-4 md:grid-cols-2">{mistakes.slice(0, 8).map((question) => <CompactCard key={question.id} title={question.prompt} meta={question.skill_titles.join(", ") || test.topic_slug} href={`/student/mistakes/${session.id}-${question.id}`} action="Review" />)}</div>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Link href="/student/mistakes" className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Review mistakes</Link>
        <Link href="/student/tests" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold">Back to tests</Link>
        <Link href={`/student/tests/${test.slug}/start`} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold">Retake test</Link>
      </div>
    </StudentShell>
  );
}

export function StudentMistakes({ initialSummary }: { initialSummary: ApiMistakesSummary }) {
  const [summary, setSummary] = useState(initialSummary);
  const [query, setQuery] = useState("");
  useEffect(() => {
    questApi.mistakesSummary(getStudentCode()).then(setSummary).catch(() => undefined);
  }, []);
  const mistakes = summary.mistakes.filter((item) => `${item.test_title} ${item.topic} ${item.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <StudentShell eyebrow="Student" title="Mistakes" copy="Testlardan chiqqan xatolar va review holati.">
      <div className="flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3 py-2">
        <Search className="size-4 text-black/35" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Subject, topic, test, status..." className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mistakes.map((mistake) => <CompactCard key={`${mistake.session_id}-${mistake.question_id}`} title={mistake.prompt} meta={`${mistake.test_title} / ${mistake.topic}`} href={`/student/mistakes/${mistake.session_id}-${mistake.question_id}`} action="Review" stats={[mistake.skills[0] ?? "Skill", "review needed"]} />)}
        {!mistakes.length ? <Empty text="Xato topilmadi." /> : null}
      </div>
    </StudentShell>
  );
}

export function StudentMistakeDetail({ initialSummary, mistakeId }: { initialSummary: ApiMistakesSummary; mistakeId: string }) {
  const [summary, setSummary] = useState(initialSummary);
  useEffect(() => {
    questApi.mistakesSummary(getStudentCode()).then(setSummary).catch(() => undefined);
  }, []);
  const mistake = summary.mistakes.find((item) => `${item.session_id}-${item.question_id}` === mistakeId) ?? summary.mistakes[0];
  if (!mistake) return <StudentShell eyebrow="Mistake" title="Mistake not found"><Empty text="Bu xato topilmadi." /></StudentShell>;
  return (
    <StudentShell eyebrow="Mistake detail" title={mistake.test_title} copy={mistake.topic}>
      <Section title="Question">
        <div className="rounded-xl border border-black/8 bg-white p-4">
          <LatexText text={mistake.prompt} />
          <div className="mt-4 grid gap-2 text-sm text-black/60">
            <p><strong>Your answer:</strong> {mistake.user_answer || "Skipped"}</p>
            <p><strong>Correct answer:</strong> {mistake.correct_answer}</p>
            <p><strong>Related topic:</strong> {mistake.topic}</p>
            <p><strong>Common mistake:</strong> {mistake.skills.length ? `${mistake.skills.join(", ")} skillini qayta ko'rib chiqish kerak.` : "Asosiy tushunchani qayta tekshiring."}</p>
          </div>
          {mistake.explanation ? <div className="mt-4 rounded-xl bg-[#fbfbf6] p-4 text-sm leading-6 text-black/62"><LatexText text={mistake.explanation} /></div> : null}
        </div>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Link href="/student/mistakes" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold">Back</Link>
        <Link href="/student/tests" className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Practice topic</Link>
        <button className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold">Mark as reviewed</button>
      </div>
    </StudentShell>
  );
}

export function StudentProgress({ summary }: { summary: ApiProfileSummary }) {
  const strong = summary.topic_progress.filter((item) => item.value >= 75);
  const weak = summary.topic_progress.filter((item) => item.value < 70);
  return (
    <StudentShell eyebrow="Student" title="Progress" copy="Overall progress, subject progress, topic mastery va score trend.">
      <SummaryGrid stats={[["Average score", `${summary.average_score}%`], ["Completed tests", summary.tests_taken], ["Answered", summary.answered_questions], ["Correct", summary.correct_answers]]} />
      <Section title="Topic mastery">
        <div className="grid gap-3 md:grid-cols-2">{summary.topic_progress.map((topic) => <CompactCard key={topic.slug} title={topic.topic} meta={`${topic.attempts} attempts`} href="/student/tests" action="Open" stats={[`${topic.value}% mastery`]} />)}</div>
      </Section>
      <Section title="Weak / strong topics">
        <div className="grid gap-4 md:grid-cols-2"><TopicList title="Weak topics" items={weak} /><TopicList title="Strong topics" items={strong} /></div>
      </Section>
    </StudentShell>
  );
}

export function StudentProfile({ summary }: { summary: ApiProfileSummary }) {
  return (
    <StudentShell eyebrow="Student" title="Profile" copy="Basic settings va test history summary.">
      <SummaryGrid stats={[["Name", summary.name], ["Role", "Student"], ["School", "Not linked"], ["Class", "Not linked"], ["Teacher", "Not linked"], ["Tests", summary.tests_taken]]} />
      <Section title="Test history summary">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{summary.recent_tests.map((test) => <CompactCard key={test.id} title={test.title} meta={test.topic} href={`/student/results/${test.id}`} action="View result" stats={[`${test.score}%`, test.submitted_at.slice(0, 10)]} />)}</div>
      </Section>
    </StudentShell>
  );
}

function TestCard({ test, status, session }: { test: ApiTest; status: TestStatus; session?: ApiSession }) {
  const action = status === "completed" ? "View result" : status === "in_progress" ? "Continue" : "Open";
  const href = status === "completed" && session ? `/student/results/${session.id}` : status === "in_progress" && session ? `/student/test-session/${session.id}` : `/student/tests/${test.slug}`;
  return <CompactCard title={test.title} meta={`${test.subject_slug} / ${test.topic_slug}`} href={href} action={action} status={status} stats={[`${test.test_questions.length} questions`, `${test.estimated_minutes} min`]} />;
}

function PackCard({ pack }: { pack: ApiExamPack }) {
  return <CompactCard title={pack.title} meta={pack.exam_type || "Pack"} href={`/student/packs/${pack.slug}`} action="Open" status={pack.visibility} stats={[`${pack.item_count} tests`, pack.price_label || "Free"]} />;
}

function StudentShell({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy?: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f7ef] px-4 py-4 text-[#151713] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-xl border border-black/8 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#276a5b]">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
          {copy ? <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-black/58">{copy}</p> : null}
        </header>
        <div className="mt-4 grid gap-4">{children}</div>
      </div>
    </main>
  );
}

function SummaryGrid({ stats }: { stats: Array<[string, string | number]> }) {
  return <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="min-h-[94px] rounded-xl border border-black/8 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p><p className="mt-2 line-clamp-2 text-2xl font-semibold">{value}</p></div>)}</section>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-black/8 bg-white/70 p-4"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function CompactCard({ title, meta, href, action, status, stats = [] }: { title: string; meta?: string; href: string; action: string; status?: string; stats?: string[] }) {
  return (
    <Link href={href} className="flex min-h-[150px] flex-col rounded-xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-5">{title}</h3>
          {meta ? <p className="mt-1 line-clamp-1 text-sm text-black/50">{meta}</p> : null}
        </div>
        {status ? <Badge>{status.replace("_", " ")}</Badge> : null}
      </div>
      {stats.length ? <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-black/45">{stats.map((item) => <span key={item} className="rounded-lg bg-[#fbfbf6] px-2 py-1">{item}</span>)}</div> : null}
      <span className="mt-auto w-fit rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">{action}</span>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-lg bg-[#edf7f3] px-2 py-1 text-xs font-semibold text-[#276a5b]">{children}</span>;
}

function Tabs({ value, onChange, items }: { value: TestStatus; onChange: (value: TestStatus) => void; items: TestStatus[] }) {
  return <div className="flex gap-2 overflow-x-auto">{items.map((item) => <button key={item} onClick={() => onChange(item)} className={cn("rounded-xl border px-4 py-2 text-sm font-semibold", value === item ? "border-[#151713] bg-[#151713] text-white" : "border-black/10 bg-white")}>{item.replace("_", " ")}</button>)}</div>;
}

function TopicList({ title, items }: { title: string; items: ApiProfileSummary["topic_progress"] }) {
  return <div className="rounded-xl border border-black/8 bg-white p-4"><h3 className="font-semibold">{title}</h3><div className="mt-3 grid gap-2">{items.map((item) => <div key={item.slug} className="flex justify-between text-sm"><span>{item.topic}</span><strong>{item.value}%</strong></div>)}{!items.length ? <p className="text-sm text-black/50">No data</p> : null}</div></div>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-black/12 bg-white p-4 text-sm text-black/55">{text}</p>;
}
