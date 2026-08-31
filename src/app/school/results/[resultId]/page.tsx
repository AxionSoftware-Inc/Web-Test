import { ResultDetailPage } from "@/features/platform/ui/panel-pages";

export default async function Page({ params }: { params: Promise<{ resultId: string }> }) {
  return <ResultDetailPage resultId={(await params).resultId} role="school" />;
}
