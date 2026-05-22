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
  const packResults = await Promise.all(
    packs.map((pack) => questApi.examPackResults(pack.slug).catch(() => null)),
  );
  const usageBySlug = Object.fromEntries(
    packResults
      .filter((result): result is NonNullable<typeof result> => Boolean(result))
      .map((result) => [
        result.pack.slug,
        {
          attempts: result.attempts,
          students_submitted: result.students_submitted,
          average_score: result.average_score,
        },
      ]),
  );

  return (
    <PremiumPage>
      <ExamPacksClient initialPacks={packs} tests={tests} usageBySlug={usageBySlug} />
    </PremiumPage>
  );
}
