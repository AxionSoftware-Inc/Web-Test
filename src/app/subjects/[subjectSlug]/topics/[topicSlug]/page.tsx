import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TopicDetailPage } from "@/features/subjects/ui/topic-detail-page";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectSlug: string; topicSlug: string }>;
}): Promise<Metadata> {
  const { topicSlug } = await params;
  const capitalized = topicSlug.charAt(0).toUpperCase() + topicSlug.slice(1);
  return {
    title: `${capitalized} | QuestLab`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ subjectSlug: string; topicSlug: string }>;
}) {
  const { subjectSlug, topicSlug } = await params;

  try {
    const levels = await questApi.topicLevels(topicSlug);

    const topicTitle = topicSlug.charAt(0).toUpperCase() + topicSlug.slice(1);
    const subjectTitle = subjectSlug.charAt(0).toUpperCase() + subjectSlug.slice(1);

    return (
      <TopicDetailPage
        subjectSlug={subjectSlug}
        subjectTitle={subjectTitle}
        topicSlug={topicSlug}
        topicTitle={topicTitle}
        levels={levels}
      />
    );
  } catch {
    notFound();
  }
}
