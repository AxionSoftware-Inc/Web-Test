import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  redirect(`/teacher/results/${(await params).sessionId}`);
}
