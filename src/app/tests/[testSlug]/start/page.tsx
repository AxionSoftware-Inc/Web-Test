import { redirect } from "next/navigation";

import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ testSlug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { testSlug } = await params;
  const session = await questApi.startTest(testSlug);

  redirect(`/test-session/${session.id}/question/1`);
}
