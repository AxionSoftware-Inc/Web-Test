import { ArrowRight, CheckCircle2, Clock, Layers3, Target } from "lucide-react";
import Link from "next/link";

import type { ApiLevel } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";

const algebraLevels = [
  {
    title: "Beginner",
    status: "Ready",
    mastery: 72,
    copy: "Linear equations, expressions, factoring and quadratic basics.",
    skills: ["Expressions", "Linear equations", "Factoring", "Quadratics"],
  },
  {
    title: "Intermediate",
    status: "Next",
    mastery: 46,
    copy: "Functions, inequalities, systems and word problems.",
    skills: ["Functions", "Inequalities", "Systems", "Modeling"],
  },
  {
    title: "Advanced",
    status: "Locked roadmap",
    mastery: 18,
    copy: "Polynomials, sequences, proof-style algebra and olympiad patterns.",
    skills: ["Polynomials", "Sequences", "Proof patterns", "Olympiad algebra"],
  },
];

const algebraRoadmap = [
  "Arithmetic fluency",
  "Variables and expressions",
  "Linear equations",
  "Systems of equations",
  "Quadratic equations",
  "Functions and graphs",
  "Polynomials",
  "Algebraic proofs",
];

export function AlgebraTopicPage({ levels }: { levels: ApiLevel[] }) {
  const allTests = levels.flatMap((level) => level.tests);
  const primaryTest = allTests[0];

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-8">
        <header className="grid gap-5 border-b border-black/10 pb-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <Link href="/subjects/mathematics" className="text-sm font-semibold text-[#276a5b]">
              Mathematics
            </Link>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">
              Core math topic
            </p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight">Algebra</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
              Algebra MVP uchun asosiy bo&apos;lim: user shu yerda darajani tanlaydi,
              test boshlaydi, progressni ko&apos;radi va keyingi skillni ochadi.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {primaryTest ? (
                <Link
                  href={`/tests/${primaryTest.slug}/start`}
                  className="rounded-md bg-[#151713] px-5 py-3 text-sm font-semibold text-white"
                >
                  Start Algebra Test
                </Link>
              ) : null}
              <Link href={primaryTest ? `/tests/${primaryTest.slug}` : "/tests"} className="rounded-md border border-black/10 px-5 py-3 text-sm font-semibold">
                View test details
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <p className="text-sm text-black/50">Algebra mastery</p>
            <h2 className="mt-2 text-4xl font-semibold">68%</h2>
            <div className="mt-5 h-3 rounded bg-black/10">
              <div className="h-3 w-[68%] rounded bg-[#276a5b]" />
            </div>
            <p className="mt-3 text-sm leading-6 text-black/60">
              Strong in basic equations. Needs more work on functions and word problems.
            </p>
          </div>
        </header>

        <section className="grid gap-4 py-8 lg:grid-cols-3">
          {levels.map((level, index) => {
            const meta = algebraLevels[index] ?? algebraLevels[0];
            return (
            <article key={level.difficulty} className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">{level.label}</h2>
                <span className="rounded-md bg-[#edf7f3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#276a5b]">
                  {meta.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-black/62">{meta.copy}</p>
              <div className="mt-5 h-2 rounded bg-black/10">
                <div className="h-2 rounded bg-[#276a5b]" style={{ width: `${meta.mastery}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold">{meta.mastery}% mastery</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {meta.skills.map((skill) => (
                  <span key={skill} className="rounded-md border border-black/10 bg-[#fbfbf8] px-3 py-2 text-sm text-black/62">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-5 grid gap-2 border-t border-black/10 pt-5">
                {level.tests.map((test) => (
                    <div key={test.slug} className="rounded-md bg-[#fbfbf8] p-3">
                      <p className="text-sm font-semibold">{test.title}</p>
                      <p className="mt-1 text-xs text-black/50">{test.estimated_minutes} min / {test.difficulty}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/tests/${test.slug}/start`} className="rounded-md bg-[#151713] px-3 py-2 text-xs font-semibold text-white">
                          Start test
                        </Link>
                        <Link href={`/tests/${test.slug}`} className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold">
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </article>
          )})}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center gap-2">
              <Layers3 className="size-5 text-[#276a5b]" />
              <h2 className="text-xl font-semibold">Algebra roadmap</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {algebraRoadmap.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-md border border-black/10 bg-[#fbfbf8] p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="font-semibold">{step}</span>
                  {index < 4 ? <CheckCircle2 className="ml-auto size-5 text-[#276a5b]" /> : <Clock className="ml-auto size-5 text-black/35" />}
                </div>
              ))}
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-2">
                <Target className="size-5 text-[#276a5b]" />
                <h2 className="text-xl font-semibold">Available tests</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {allTests.map((test) => (
                  <Link key={test.slug} href={`/tests/${test.slug}`} className="rounded-md border border-black/10 bg-[#fbfbf8] p-4">
                    <p className="font-semibold">{test.title}</p>
                    <p className="mt-1 text-sm text-black/55">{test.difficulty} / {test.estimated_minutes} min</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#276a5b]">
                      Open
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-[#151713] p-5 text-white">
              <h2 className="text-xl font-semibold">Today&apos;s focus</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Quadratic equations basics testini ishlang, keyin wrong answer review orqali zaif joylarni belgilang.
              </p>
              {primaryTest ? (
                <Link href={`/tests/${primaryTest.slug}/start`} className="mt-5 block rounded-md bg-[#8fd6bd] px-4 py-3 text-center text-sm font-semibold text-[#151713]">
                  Start now
                </Link>
              ) : null}
            </div>
          </aside>
        </section>
      </Container>
    </main>
  );
}
