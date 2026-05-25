import { SchoolStudentDetailPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  return <SchoolStudentDetailPage studentId={(await params).studentId} />;
}
