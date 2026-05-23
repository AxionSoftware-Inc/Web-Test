import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ resultId: string }> }) {
  redirect(`/results/${(await params).resultId}`);
}
