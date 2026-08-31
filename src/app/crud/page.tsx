import { UnifiedTestModule } from "@/features/crud/ui/unified-test-module";
import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage } from "@/shared/ui/premium-shell";

export const dynamic = "force-dynamic";

export default async function CrudPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const [subjects, topics, tests, skills] = await Promise.all([
    questApi.subjects(),
    questApi.topics(),
    questApi.tests(),
    questApi.skills(),
  ]);

  return <PremiumPage><UnifiedTestModule subjects={subjects} topics={topics} tests={tests} skills={skills} advanced={params.mode === "advanced"} /></PremiumPage>;
}
