import type { Metadata } from "next";

import { PackItemClient } from "@/features/exam-packs/ui/pack-item-client";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ packSlug: string }>;
};

export const metadata: Metadata = {
  title: "Add Test To Pack | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { packSlug } = await params;
  const tests = await questApi.topicTests("algebra");

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-10">
      <PackItemClient packSlug={packSlug} tests={tests} />
    </main>
  );
}
