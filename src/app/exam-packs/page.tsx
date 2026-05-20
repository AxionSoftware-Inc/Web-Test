import type { Metadata } from "next";

import { ExamPacksClient } from "@/features/exam-packs/ui/exam-packs-client";
import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "Exam Packs | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [packs, tests] = await Promise.all([
    questApi.examPacks(),
    questApi.tests(),
  ]);

  return (
    <PremiumPage>
      <ExamPacksClient initialPacks={packs} tests={tests} />
    </PremiumPage>
  );
}
