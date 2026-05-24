import type { Metadata } from "next";

import { questApi } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export const metadata: Metadata = {
  title: "Question Discussion | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { questionId } = await params;
  await questApi.question(questionId);

  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Discussion</p>
          <h1 className="mt-3 text-4xl font-semibold">Community explanation thread</h1>
          <div className="mt-6 grid gap-3">
            {["Nega bu formula ishlaydi?", "Qaysi skill zaif bo'lsa shu savolda xato bo'ladi?", "Similar problem tavsiyasi kerak."].map((item) => (
              <div key={item} className="rounded-xl bg-white/58 p-4 text-sm leading-6 text-black/68">{item}</div>
            ))}
          </div>
        </GlassCard>
      </Container>
    </main>
  );
}
