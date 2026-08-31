import type {
  GeneratedQuestion,
  TestAnswerMap,
} from "@/features/test-generator/model/test-generator-types";
import { isAnswerCorrectForType } from "@/shared/model/answer-scoring";

export { normalizeAnswer } from "@/shared/model/answer-scoring";

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

  return isAnswerCorrectForType(question.type, question.answer, answer);
}
