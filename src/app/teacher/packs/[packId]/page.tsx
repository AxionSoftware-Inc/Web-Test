import { PackDetailPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ packId: string }> }) {
  return <PackDetailPage packId={(await params).packId} base="/teacher/packs" />;
}
