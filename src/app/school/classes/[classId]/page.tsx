import { SchoolClassDetailPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ classId: string }> }) {
  return <SchoolClassDetailPage classId={(await params).classId} />;
}
