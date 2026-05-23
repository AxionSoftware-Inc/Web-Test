import { StudentProfile } from "@/features/student/ui/student-testing";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <StudentProfile summary={await questApi.profileSummary()} />;
}
