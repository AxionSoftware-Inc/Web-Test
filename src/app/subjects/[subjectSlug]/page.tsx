import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubjectTopicsPage } from "@/features/subjects/ui/subject-topics-page";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}): Promise<Metadata> {
  const { subjectSlug } = await params;
  const capitalized = subjectSlug.charAt(0).toUpperCase() + subjectSlug.slice(1);
  return {
    title: `${capitalized} | QuestLab`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;

  try {
    const topics = await questApi.subjectTopics(subjectSlug);
    const subjectTitle = subjectSlug.charAt(0).toUpperCase() + subjectSlug.slice(1);

    return (
      <SubjectTopicsPage
        subjectSlug={subjectSlug}
        subjectTitle={subjectTitle}
        topics={topics}
      />
    );
  } catch {
    notFound();
  }
}
