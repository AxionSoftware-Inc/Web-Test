import type { Metadata } from "next";

import { TopicDetailPage } from "@/features/subjects/ui/topic-detail-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Algebra | QuestLab",
  description: "Algebra darajalari, testlari va mashqlari.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const levels = await questApi.topicLevels("algebra");
  return (
    <TopicDetailPage
      subjectSlug="mathematics"
      subjectTitle="Matematika"
      topicSlug="algebra"
      topicTitle="Algebra"
      levels={levels}
    />
  );
}
