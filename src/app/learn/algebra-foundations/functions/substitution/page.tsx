import type { Metadata } from "next";

import { AlgebraLessonPage } from "@/features/learning/ui/algebra-lesson-page";

export const metadata: Metadata = {
  title: "Function Substitution | QuestLab",
};

export default function Page() {
  return (
    <AlgebraLessonPage
      eyebrow="Algebra lesson"
      title="Function substitution"
      copy="When you see f(5), replace every x in the function rule with 5 and simplify carefully."
      steps={[
        { title: "Identify input", copy: "The number inside parentheses is the input value." },
        { title: "Replace x", copy: "Substitute the input everywhere x appears." },
        { title: "Simplify", copy: "Follow order of operations and calculate accurately." },
      ]}
    />
  );
}
