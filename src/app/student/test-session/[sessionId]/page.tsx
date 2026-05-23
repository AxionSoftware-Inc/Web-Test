import { StudentActiveSession } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await questApi.session((await params).sessionId);
  const test = await questApi.test(session.test_slug);
  return <StudentActiveSession initialSession={session} test={test} />;
}
