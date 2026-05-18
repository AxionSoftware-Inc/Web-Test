import type { Metadata } from "next";

import { ExamPackWorkspace } from "@/features/exam-packs/ui/exam-pack-workspace";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ packSlug: string }>;
};

export const metadata: Metadata = {
  title: "Exam Pack | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { packSlug } = await params;
  const [pack, items, results, tests] = await Promise.all([
    questApi.examPack(packSlug),
    questApi.examPackItems(packSlug),
    questApi.examPackResults(packSlug),
    questApi.tests(),
  ]);

  return <ExamPackWorkspace pack={pack} initialItems={items} results={results} tests={tests} />;
}
