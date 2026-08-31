import type { Metadata } from "next";

import { PackItemClient } from "@/features/exam-packs/ui/pack-item-client";
import { questApi } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";

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
    <main className="quest-page"><Container className="py-8"><PackItemClient packSlug={packSlug} tests={tests} /></Container></main>
  );
}
