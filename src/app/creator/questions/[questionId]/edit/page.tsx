import { CreatorQuestionEditPage } from "@/features/platform/ui/panel-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ questionId: string }> }) {
  return <CreatorQuestionEditPage questionId={(await params).questionId} />;
}
