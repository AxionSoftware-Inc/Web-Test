import type {
  GeneratedQuestion,
  TestAnswerMap,
} from "@/features/test-generator/model/test-generator-types";

export function getSessionResult(questions: GeneratedQuestion[], answers: TestAnswerMap) {
  const correct = questions.filter((question) => isAnswerCorrect(question, answers[question.id] ?? "")).length;

  return {
    correct,
    total: questions.length,
    percent: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100),
  };
}

export function isAnswerCorrect(question: GeneratedQuestion, answer: string) {
  if (!question.answer) {
    return false;
  }

  return normalizeAnswer(question.answer) === normalizeAnswer(answer);
}

export function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .replace(/\\cdot/g, "*")
    .replace(/\\/g, "");
}
