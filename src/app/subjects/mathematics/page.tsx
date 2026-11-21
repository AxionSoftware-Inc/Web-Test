import type { Metadata } from "next";

import { SubjectTopicsPage } from "@/features/subjects/ui/subject-topics-page";
import { questApi } from "@/shared/api/questlab-api";

export const metadata: Metadata = {
  title: "Matematika | QuestLab",
  description: "Matematikani bo'limlar orqali o'rganish va test qilish.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const topics = await questApi.subjectTopics("mathematics");
  return (
    <SubjectTopicsPage
      subjectSlug="mathematics"
      subjectTitle="Matematika"
      topics={topics}
    />
  );
}
