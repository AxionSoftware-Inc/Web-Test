import type { Metadata } from "next";

import { createSessionId, getTestOrThrow, getTestQuestions, platformTests } from "@/features/test-engine/model/test-engine-content";
import { PrimaryLink, SecondaryLink, StatCard, TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ testSlug: string }>;
};

export function generateStaticParams() {
  return platformTests.map((test) => ({ testSlug: test.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { testSlug } = await params;
  const test = getTestOrThrow(testSlug);

  return {
    title: `${test.title} | QuestLab`,
    description: `${test.category} ${test.difficulty} test with a structured QuestLab session flow.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { testSlug } = await params;
  const test = getTestOrThrow(testSlug);
  const questions = getTestQuestions(testSlug);
  const sessionId = createSessionId(testSlug);
  const questionTypes = Array.from(new Set(questions.map((question) => question.type)));
  const topicSlug = test.category.toLowerCase().replace(/\s+/g, "-");

  return (
    <TestShell
      eyebrow={`${test.subject} / ${test.category}`}
      title={test.title}
      description="Boshlashdan oldin test nimani tekshirishi, qancha vaqt olishi va natijada qanday feedback chiqishini ko'rib oling."
      actions={
        <>
          <PrimaryLink href={`/test-session/${sessionId}`}>Start test</PrimaryLink>
          <SecondaryLink href={`/tests/${test.id}/instructions`}>Read rules</SecondaryLink>
        </>
      }
    >
      <section className="grid gap-4 py-8 md:grid-cols-4">
        <StatCard label="Questions" value={String(questions.length)} />
        <StatCard label="Time limit" value={`${test.estimatedMinutes} min`} />
        <StatCard label="Difficulty" value={test.difficulty} />
        <StatCard label="Passing score" value="70%" />
      </section>
      <section className="grid gap-5 pb-8 lg:grid-cols-[1fr_0.42fr]">
        <div className="grid gap-5">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold">What this test checks</h2>
            <p className="mt-3 text-sm leading-6 text-black/62">
              This assessment focuses on {test.category.toLowerCase()} in {test.subject}. It is short enough for a quick diagnostic, but structured enough to expose weak spots before you move into practice or a full course.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[test.category, test.subject, test.difficulty, "timed assessment", ...questionTypes].map((item) => (
                <span key={item} className="rounded-md bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold">Question preview</h2>
            <div className="mt-4 grid gap-3">
              {questions.slice(0, 3).map((question, index) => (
                <div key={question.id} className="rounded-md border border-black/10 bg-[#fbfbf8] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#276a5b]">Question {index + 1}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{question.type}</p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-black/68">{question.prompt}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold">After submit you get</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Score", "Correct, wrong and skipped question summary."],
                ["Breakdown", "Topic and skill level diagnosis for next steps."],
                ["Review", "Each question with answer, explanation and recovery route."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-md border border-black/10 bg-[#fbfbf8] p-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/60">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid gap-5">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold">Best for</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-black/62">
              <li>Quick level check before learning a topic.</li>
              <li>Finding weak spots for targeted practice.</li>
              <li>Retaking after review to measure progress.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold">Recommended path</h2>
            <div className="mt-4 grid gap-3">
              <SecondaryLink href={`/practice/${topicSlug}`}>Practice this topic</SecondaryLink>
              <SecondaryLink href="/questions">Open question bank</SecondaryLink>
              <SecondaryLink href="/results">View previous results</SecondaryLink>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-[#151713] p-5 text-white">
            <h2 className="text-xl font-semibold">Ready?</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Start directly if you already know the rules. Open rules if this is an exam-style attempt.
            </p>
            <div className="mt-5 grid gap-3">
              <PrimaryLink href={`/test-session/${sessionId}`}>Start test</PrimaryLink>
              <SecondaryLink href={`/tests/${test.id}/instructions`}>Read rules</SecondaryLink>
            </div>
          </div>
        </aside>
      </section>
    </TestShell>
  );
}
