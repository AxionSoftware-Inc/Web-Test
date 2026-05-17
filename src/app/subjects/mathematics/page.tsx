import type { Metadata } from "next";

import { MathematicsPage } from "@/features/subjects/mathematics/ui/mathematics-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Mathematics | QuestLab",
  description: "Practice mathematics by level, topic and generated test sessions.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const topics = await questApi.subjectTopics("mathematics");
  return <MathematicsPage topics={topics} />;
}
