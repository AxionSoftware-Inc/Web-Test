import type { Metadata } from "next";

import { PrimaryLink, SecondaryLink, TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ testSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { testSlug } = await params;
  const test = await questApi.test(testSlug);

  return {
    title: `${test.title} Instructions | QuestLab`,
  };
}

export default async function Page({ params }: PageProps) {
  const { testSlug } = await params;
  const test = await questApi.test(testSlug);

  return (
    <TestShell
      eyebrow="Before you start"
      title={`${test.title} instructions`}
      description="Confirm the rules before creating a session. The MVP flow keeps this page separate so proctored, timed and contest rules can be added later."
      actions={
        <>
          <PrimaryLink href={`/tests/${test.slug}/start`}>Start test</PrimaryLink>
          <SecondaryLink href={`/tests/${test.slug}`}>Back to test</SecondaryLink>
        </>
      }
    >
      <section className="grid gap-4 py-8 md:grid-cols-2">
        {[
          ["Time limit", `${test.estimated_minutes} minutes`],
          ["Questions", "Answer all questions before final submit."],
          ["Scoring", "No negative marking in this MVP version."],
          ["Review", "You can review answered and unanswered questions before submit."],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-black/60">{copy}</p>
          </div>
        ))}
      </section>
    </TestShell>
  );
}
