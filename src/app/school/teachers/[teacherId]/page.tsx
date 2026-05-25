import { SchoolTeacherDetailPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ teacherId: string }> }) {
  return <SchoolTeacherDetailPage teacherId={(await params).teacherId} />;
}
