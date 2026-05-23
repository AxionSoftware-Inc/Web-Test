import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ questionId: string }> }) {
  redirect(`/questions/${(await params).questionId}`);
}
