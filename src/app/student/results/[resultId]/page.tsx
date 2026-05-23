import { StudentResult } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ resultId: string }> }) {
  const session = await questApi.session((await params).resultId);
  const test = await questApi.test(session.test_slug);
  return <StudentResult session={session} test={test} />;
}
