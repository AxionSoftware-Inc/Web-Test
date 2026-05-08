import type { Metadata } from "next";

import { questApi } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";
import { LatexText } from "@/shared/ui/latex-text";

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export const metadata: Metadata = {
  title: "Question Solution | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { questionId } = await params;
  const question = await questApi.question(questionId);

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">Solution</p>
          <h1 className="mt-3 text-4xl font-semibold">Correct answer: <LatexText text={question.answer || "Unavailable"} /></h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62"><LatexText text={question.explanation || "Explanation will be added by the content editor."} /></p>
        </GlassCard>
      </Container>
    </main>
  );
}
