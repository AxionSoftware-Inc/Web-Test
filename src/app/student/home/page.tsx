import { StudentHomeClient } from "@/features/roles/ui/student-home-client";
import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage } from "@/shared/ui/premium-shell";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [summary, packs, tests] = await Promise.all([
    questApi.profileSummary(),
    questApi.examPacks(),
    questApi.tests(),
  ]);
  return (
    <PremiumPage>
      <StudentHomeClient initialSummary={summary} packs={packs.filter((pack) => pack.is_active)} tests={tests.filter((test) => test.status === "published")} />
    </PremiumPage>
  );
}
