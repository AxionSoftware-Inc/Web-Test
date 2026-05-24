import type { Metadata } from "next";
import Link from "next/link";

import { createSessionId, getResultId, platformTests } from "@/features/test-engine/model/test-engine-content";
import { TestShell } from "@/features/test-engine/ui/test-shell";

export const metadata: Metadata = {
  title: "Results | QuestLab",
  description: "Test and practice result history.",
};

export default function Page() {
  return (
    <TestShell eyebrow="Results" title="Recent attempts" description="Demo result history connected to the MVP test-session routes.">
      <section className="grid gap-4 py-8">
        {platformTests.map((test) => {
          const sessionId = createSessionId(test.id);

          return (
            <Link key={test.id} href={`/results/${getResultId(sessionId)}`} className="rounded-lg border border-black/10 bg-white p-5">
              <p className="text-sm font-semibold text-brand">{test.subject}</p>
              <h2 className="mt-2 text-xl font-semibold">{test.title}</h2>
              <p className="mt-2 text-sm text-black/55">Open detailed result and question review.</p>
            </Link>
          );
        })}
      </section>
    </TestShell>
  );
}
