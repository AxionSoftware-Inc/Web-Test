import { StudentMistakeDetail } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ mistakeId: string }> }) {
  return <StudentMistakeDetail mistakeId={(await params).mistakeId} initialSummary={await questApi.mistakesSummary()} />;
}
