import type { Metadata } from "next";

import { MathematicsPage } from "@/features/subjects/mathematics/ui/mathematics-page";

export const metadata: Metadata = {
  title: "Mathematics | QuestLab",
  description: "Practice mathematics by level, topic and generated test sessions.",
};

export default function Page() {
  return <MathematicsPage />;
}
