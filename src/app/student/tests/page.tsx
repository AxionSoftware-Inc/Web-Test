import { StudentTestsWorkspace } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [tests, packs, sessions] = await Promise.all([
    questApi.tests(),
    questApi.examPacks(),
    questApi.sessions().catch(() => []),
  ]);
  return <StudentTestsWorkspace tests={tests.filter((test) => test.status === "published")} packs={packs} sessions={sessions} />;
}
