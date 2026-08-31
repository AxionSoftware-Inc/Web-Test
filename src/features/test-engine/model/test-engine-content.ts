import { notFound } from "next/navigation";

import { latexTestBank } from "@/features/test-generator/model/latex-test-bank";
import { parseLatexTest } from "@/features/test-generator/lib/latex-test-parser";

export const platformTests = latexTestBank;

export function getTestOrThrow(testSlug: string) {
  const test = platformTests.find((item) => item.id === testSlug);

  if (!test) {
    notFound();
  }

  return test;
}

export function getTestQuestions(testSlug: string) {
  return parseLatexTest(getTestOrThrow(testSlug).latex);
}
