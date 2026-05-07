import type { Metadata } from "next";

import { AlgebraLessonPage } from "@/features/learning/ui/algebra-lesson-page";

export const metadata: Metadata = {
  title: "Solving Linear Equations | QuestLab",
};

export default function Page() {
  return (
    <AlgebraLessonPage
      eyebrow="Algebra lesson"
      title="Solving linear equations"
      copy="Linear equations are solved by keeping both sides balanced. Every operation on one side must be applied to the other side."
      steps={[
        { title: "Collect terms", copy: "Move variable terms to one side and constants to the other." },
        { title: "Undo operations", copy: "Use inverse operations to isolate the variable." },
        { title: "Check", copy: "Substitute the answer back into the original equation." },
      ]}
    />
  );
}
