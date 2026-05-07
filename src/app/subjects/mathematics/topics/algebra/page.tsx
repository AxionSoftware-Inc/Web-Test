import type { Metadata } from "next";

import { AlgebraTopicPage } from "@/features/subjects/mathematics/ui/algebra-topic-page";

export const metadata: Metadata = {
  title: "Algebra | QuestLab Math",
  description: "Algebra levels, tests, practice roadmap and progress for QuestLab mathematics MVP.",
};

export default function Page() {
  return <AlgebraTopicPage />;
}
