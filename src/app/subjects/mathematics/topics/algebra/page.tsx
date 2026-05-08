import type { Metadata } from "next";

import { AlgebraTopicPage } from "@/features/subjects/mathematics/ui/algebra-topic-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Algebra | QuestLab Math",
  description: "Algebra levels, tests, practice roadmap and progress for QuestLab mathematics MVP.",
};

export default async function Page() {
  const levels = await questApi.topicLevels("algebra");
  return <AlgebraTopicPage levels={levels} />;
}
