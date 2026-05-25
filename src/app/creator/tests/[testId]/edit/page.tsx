import { CreatorTestEditPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ testId: string }> }) {
  return <CreatorTestEditPage testId={(await params).testId} />;
}
