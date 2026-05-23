import { notFound } from "next/navigation";

import { StudentTestInstructions } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const [tests, sessions] = await Promise.all([questApi.tests(), questApi.sessions().catch(() => [])]);
  const test = tests.find((item) => item.slug === testId || String(item.id) === testId);
  if (!test) notFound();
  return <StudentTestInstructions test={test} session={sessions.find((item) => item.test_slug === test.slug)} />;
}
