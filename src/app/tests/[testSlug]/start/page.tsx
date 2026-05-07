import { redirect } from "next/navigation";

import { createSessionId, getTestOrThrow } from "@/features/test-engine/model/test-engine-content";

type PageProps = {
  params: Promise<{ testSlug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { testSlug } = await params;
  const test = getTestOrThrow(testSlug);

  redirect(`/test-session/${createSessionId(test.id)}`);
}
