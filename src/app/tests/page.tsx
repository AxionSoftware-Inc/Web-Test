import type { Metadata } from "next";
import Link from "next/link";

import { createSessionId, platformTests } from "@/features/test-engine/model/test-engine-content";
import { TestShell } from "@/features/test-engine/ui/test-shell";

export const metadata: Metadata = {
  title: "Tests | QuestLab",
  description: "Browse assessment tests by subject, topic, difficulty and duration.",
};

export default function Page() {
  return (
    <TestShell
      eyebrow="Test catalog"
      title="Choose a focused test session"
      description="MVP test engine catalog for mathematics, physics and programming. Each test leads into instructions, a session, review, submit and result flow."
    >
      <section className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-3">
        {platformTests.map((test) => (
          <article key={test.id} className="rounded-lg border border-black/10 bg-white p-5">
            <p className="text-sm font-semibold text-[#276a5b]">{test.subject}</p>
            <h2 className="mt-3 text-xl font-semibold">
              <Link href={`/tests/${test.id}`}>{test.title}</Link>
            </h2>
            <p className="mt-3 text-sm text-black/58">
              {test.category} / {test.difficulty} / {test.estimatedMinutes} min
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/test-session/${createSessionId(test.id)}`}
                className="rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white"
              >
                Start test
              </Link>
              <Link
                href={`/tests/${test.id}`}
                className="rounded-md border border-black/10 px-4 py-2 text-sm font-semibold"
              >
                Details
              </Link>
              <Link
                href={`/tests/${test.id}/instructions`}
                className="rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-black/60"
              >
                Rules
              </Link>
            </div>
          </article>
        ))}
      </section>
    </TestShell>
  );
}
