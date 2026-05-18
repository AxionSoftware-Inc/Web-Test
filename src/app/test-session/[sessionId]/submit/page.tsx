import type { Metadata } from "next";

import { BackendSubmitButton } from "@/features/test-engine/ui/backend-submit-button";
import { SecondaryLink, TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Submit Test | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await questApi.session(sessionId);
  const test = await questApi.test(session.test_slug);

  return (
    <TestShell
      eyebrow="Final confirmation"
      title={`Submit ${test.title}?`}
      description="Bu oxirgi tasdiqlash sahifasi. Rozi bo'lsangiz test tugaydi va natija ochiladi."
      actions={
        <>
          <BackendSubmitButton sessionId={sessionId} />
          <SecondaryLink href={`/test-session/${sessionId}/question/1`}>Back to test</SecondaryLink>
        </>
      }
    >
      <section className="py-8">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Testni tugatishni tasdiqlang</h2>
          <p className="mt-2 text-sm leading-6 text-black/60">
            Tasdiqlagandan keyin javoblar yakuniy hisoblanadi va natija sahifasi ko'rsatiladi.
          </p>
        </div>
      </section>
    </TestShell>
  );
}
