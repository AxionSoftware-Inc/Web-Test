import type { Metadata } from "next";

import { getSessionTestOrThrow } from "@/features/test-engine/model/test-engine-content";
import { PrimaryLink, SecondaryLink, TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Submit Test | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const test = getSessionTestOrThrow(sessionId);

  return (
    <TestShell
      eyebrow="Final confirmation"
      title={`Submit ${test.title}?`}
      description="After submit, the session moves to result and question-level review. In production this route will persist final answers."
      actions={
        <>
          <PrimaryLink href={`/test-session/${sessionId}/result`}>Confirm submit</PrimaryLink>
          <SecondaryLink href={`/test-session/${sessionId}/review`}>Back to review</SecondaryLink>
        </>
      }
    >
      <section className="py-8">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Submission policy</h2>
          <p className="mt-2 text-sm leading-6 text-black/60">
            This MVP route models the final confirmation step separately so scoring, lockout and audit events can be added without changing URLs.
          </p>
        </div>
      </section>
    </TestShell>
  );
}
