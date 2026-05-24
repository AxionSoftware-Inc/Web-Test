import type { Metadata } from "next";

import { AssignTestClient } from "@/features/teacher/ui/assign-test-client";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ classSlug: string }>;
};

export const metadata: Metadata = {
  title: "Assign Test | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { classSlug } = await params;
  const tests = await questApi.topicTests("algebra");

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-10">
      <AssignTestClient classSlug={classSlug} tests={tests} />
    </main>
  );
}
