import { AdminSchoolDetailPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ schoolId: string }> }) {
  return <AdminSchoolDetailPage schoolId={(await params).schoolId} />;
}
