import type { Metadata } from "next";

import { ExamPacksClient } from "@/features/exam-packs/ui/exam-packs-client";
import { PageHeader } from "@/components/questlab/layout/page-header";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Add Pack | QuestLab",
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
    <QuestPage variant="wide">
      <PageHeader eyebrow="Creator" title="Create pack" copy="Build a pack manually or import JSON, CSV and markdown content." />
      <ExamPacksClient initialPacks={packs} tests={tests} usageBySlug={usageBySlug} />
    </QuestPage>
  );
}
