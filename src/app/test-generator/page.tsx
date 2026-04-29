import type { Metadata } from "next";

import { TestGeneratorPage } from "@/features/test-generator/ui/test-generator-page";

export const metadata: Metadata = {
  title: "LaTeX Test Generator | QuestLab",
  description: "Generate structured test drafts from LaTeX question blocks.",
};

export default function Page() {
  return <TestGeneratorPage />;
}
