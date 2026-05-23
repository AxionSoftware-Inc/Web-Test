import { AdminTestDetailPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ testId: string }> }) {
  return <AdminTestDetailPage testId={(await params).testId} />;
}
