import { TeacherClassAssignmentDetailPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ classSlug: string; assignmentId: string }> }) {
  const { classSlug, assignmentId } = await params;
  return <TeacherClassAssignmentDetailPage classSlug={classSlug} assignmentId={assignmentId} />;
}
