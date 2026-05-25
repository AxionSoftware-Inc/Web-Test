import { TeacherResultDetailPage } from "@/features/platform/ui/panel-pages";

export default async function Page({ params }: { params: Promise<{ resultId: string }> }) {
  return <TeacherResultDetailPage resultId={(await params).resultId} />;
}
