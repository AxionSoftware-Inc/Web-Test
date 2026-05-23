import { notFound } from "next/navigation";

import { StudentPackDetail } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = await params;
  const packs = await questApi.examPacks();
  const pack = packs.find((item) => item.slug === packId || String(item.id) === packId);
  if (!pack) notFound();
  const [items, results] = await Promise.all([
    questApi.examPackItems(pack.slug).catch(() => []),
    questApi.examPackResults(pack.slug).catch(() => null),
  ]);
  return <StudentPackDetail pack={pack} items={items} results={results} />;
}
