import type { Metadata } from "next";

import { AlgebraLessonPage } from "@/features/learning/ui/algebra-lesson-page";

export const metadata: Metadata = {
  title: "Factoring Basics | QuestLab",
};

export default function Page() {
  return (
    <AlgebraLessonPage
      eyebrow="Recommended lesson"
      title="Factoring quadratic expressions"
      copy="If a quadratic looks like x^2 - 5x + 6, find two numbers whose product is 6 and sum is -5. Here that pair is -2 and -3, so the expression becomes (x - 2)(x - 3)."
      steps={[
        { title: "Find product", copy: "Use the constant term as the product target." },
        { title: "Find sum", copy: "Use the middle coefficient as the sum target." },
        { title: "Write factors", copy: "Turn the pair into two binomial factors." },
      ]}
    />
  );
}
