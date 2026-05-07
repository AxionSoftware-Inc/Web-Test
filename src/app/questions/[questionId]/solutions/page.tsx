import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getQuestionBankItem } from "@/features/questions/model/question-bank";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export const metadata: Metadata = {
  title: "Question Solution | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { questionId } = await params;
  const question = getQuestionBankItem(questionId);

  if (!question) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">Solution</p>
          <h1 className="mt-3 text-4xl font-semibold">Correct answer: {question.answer ?? "Unavailable"}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">{question.explanation ?? "Explanation will be added by the content editor."}</p>
        </GlassCard>
      </Container>
    </main>
  );
}
