import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  redirect(`/test-session/${(await params).sessionId}`);
}
