import type { Metadata } from "next";

import { AboutAdminEngineBlock } from "./sections";

export const metadata: Metadata = {
  title: "About QuestLab",
};

const questionStructure = {
  id: 1,
  type: "multiple_choice",
  title: "Kasrli tenglama",
  body: "$\\\\frac{x}{4}=6$ tenglamani yeching.",
  options: ["$x=10$", "$x=18$", "$x=24$", "$x=28$"],
  answer: "$x=24$",
  explanation: "$\\\\frac{x}{4}=6 \\\\Rightarrow x=6\\\\cdot4 \\\\Rightarrow x=24$.",
  subject: "Algebra",
  topic: "Kasrli tenglamalar",
  topic_slug: "fraction-equations",
  skills: ["fraction-equation", "multiplication-property"],
  level: "beginner",
  difficulty: "easy",
  estimated_seconds: 25,
  mastery_weight: 1,
  is_fundamental: true,
  prerequisites: ["linear-equations"],
  mistake_tags: ["fraction-error", "transformation-error"],
  remediation: {
    practice_slug: "fraction-equations-practice",
    lesson_slug: "fraction-equations-review",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background py-8 text-ink">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-8 lg:px-10">
        <header className="rounded-lg border border-line bg-surface p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">About</p>
          <h1 className="mt-2 text-4xl font-semibold">QuestLab data standards</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            This page documents the public question JSON structure used by creators and import tools.
            Engine internals are visible only to admins.
          </p>
        </header>

        <section className="rounded-lg border border-line bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Question JSON structure</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                `topic_slug` is the primary grouping key for mastery and mistakes. Skills should be
                short tags, usually 1-3 per question.
              </p>
            </div>
            <span className="rounded-md bg-info-soft px-3 py-2 text-sm font-semibold text-info">Public</span>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-lg bg-ink p-4 text-xs leading-6 text-white">
            <code>{JSON.stringify(questionStructure, null, 2)}</code>
          </pre>
        </section>

        <AboutAdminEngineBlock />
      </div>
    </main>
  );
}
