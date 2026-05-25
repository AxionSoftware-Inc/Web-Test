import { isAnswerCorrect } from "@/features/assessment/lib/assessment-scoring";
import { buildSkillMastery } from "@/features/mastery-engine/model";
import type { SessionAnswerSnapshot, SkillMastery } from "@/features/mastery-engine/model";
import type { FakeSessionState } from "@/features/test-engine/model/fake-test-backend";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

const fallbackSkills = ["algebra-basics", "calculation-accuracy", "symbol-manipulation"];

const skillBank: Record<string, string[]> = {
  q1: ["quadratic-factoring", "zero-product-rule", "algebraic-expression"],
  q2: ["discriminant-formula", "substitution", "calculation-accuracy"],
  q3: ["function-evaluation", "substitution", "arithmetic"],
};

export type SkillDiagnosisItem = {
  skill: string;
  total: number;
  correct: number;
  status: "strong" | "review" | "weak";
};

export function getQuestionSkills(question: GeneratedQuestion) {
  return skillBank[question.id] ?? fallbackSkills;
}

export function getSkillDiagnosis(session: FakeSessionState, questions: GeneratedQuestion[]) {
  return buildSkillMastery("local-student", fakeSessionToSnapshots(session, questions)).map(toDiagnosisItem);
}

export function getWeakSkills(session: FakeSessionState, questions: GeneratedQuestion[]) {
  return getSkillDiagnosis(session, questions).filter((item) => item.status !== "strong");
}

function fakeSessionToSnapshots(session: FakeSessionState, questions: GeneratedQuestion[]): SessionAnswerSnapshot[] {
  const estimatedSeconds = 60;
  return questions.map((question, index) => {
    const answer = session.answers[question.id]?.answer ?? "";
    const correctAnswer = question.answer ?? "";
    const isCorrect = isAnswerCorrect(question, answer);
    return {
      id: `${session.sessionId}-${question.id}`,
      studentId: "local-student",
      sessionId: session.sessionId,
      testId: session.testSlug,
      questionId: question.id,
      selectedAnswer: answer,
      correctAnswer,
      isCorrect,
      timeSpentSeconds: estimatedSeconds,
      answeredAt: session.submittedAt ?? session.startedAt,
      subject: "Mathematics",
      topic: session.testSlug.replace(/-/g, " "),
      topicSlug: session.testSlug,
      skills: getQuestionSkills(question),
      difficulty: index > 4 ? "hard" : index > 1 ? "medium" : "easy",
      estimatedSeconds,
      masteryWeight: index > 4 ? 1.75 : index > 1 ? 1.35 : 1,
      isFundamental: false,
      prerequisites: [],
      questionTitle: question.source,
      questionPreview: question.prompt,
      explanation: question.explanation ?? "",
      visibility: "personal",
    };
  });
}

function toDiagnosisItem(item: SkillMastery): SkillDiagnosisItem {
  return {
    skill: item.skill,
    total: item.attempts,
    correct: item.correct,
    status: item.mastery >= 80 ? "strong" : item.mastery >= 50 ? "review" : "weak",
  };
}
