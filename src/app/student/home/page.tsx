import { StudentDashboard } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [summary, packs, tests, sessions] = await Promise.all([
    questApi.profileSummary(),
    questApi.examPacks(),
    questApi.tests(),
    questApi.sessions().catch(() => []),
  ]);
  return <StudentDashboard summary={summary} packs={packs} tests={tests.filter((test) => test.status === "published")} sessions={sessions} />;
}
