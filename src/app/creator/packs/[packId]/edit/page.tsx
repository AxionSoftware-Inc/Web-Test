import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ packId: string }> }) {
  redirect(`/exam-packs/${(await params).packId}`);
}
