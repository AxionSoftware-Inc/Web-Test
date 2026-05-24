import { ExamPackWorkspace } from "@/features/exam-packs/ui/exam-pack-workspace";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = await params;
  const [pack, items, results, tests] = await Promise.all([
    questApi.examPack(packId),
    questApi.examPackItems(packId),
    questApi.examPackResults(packId),
    questApi.tests(),
  ]);

  return <ExamPackWorkspace pack={pack} initialItems={items} results={results} tests={tests} />;
}
