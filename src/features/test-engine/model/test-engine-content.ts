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

export function getSessionTestOrThrow(sessionId: string) {
  return getTestOrThrow(getTestSlugFromSessionId(sessionId));
}

export function getTestQuestions(testSlug: string) {
  return parseLatexTest(getTestOrThrow(testSlug).latex);
}

export function createSessionId(testSlug: string) {
  return `demo-${testSlug}`;
}

export function getTestSlugFromSessionId(sessionId: string) {
  return sessionId.startsWith("demo-") ? sessionId.slice(5) : sessionId;
}

export function getResultId(sessionId: string) {
  return `result-${sessionId}`;
}

export function getSessionIdFromResultId(resultId: string) {
  return resultId.startsWith("result-") ? resultId.slice(7) : resultId;
}

export function getMockAnsweredCount(questionCount: number) {
  return Math.max(0, questionCount - 1);
}
