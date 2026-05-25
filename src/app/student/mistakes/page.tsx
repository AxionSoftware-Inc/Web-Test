import { StudentMistakesDiagnostic } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <StudentMistakesDiagnostic initialSummary={await questApi.mistakesSummary()} />;
}
