import { isAnswerCorrect } from "@/features/assessment/lib/assessment-scoring";
import type { FakeSessionState } from "@/features/test-engine/model/fake-test-backend";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

const fallbackSkills = ["algebra basics", "calculation accuracy", "symbol manipulation"];

const skillBank: Record<string, string[]> = {
  q1: ["quadratic factoring", "zero product rule", "algebraic expression"],
  q2: ["discriminant formula", "substitution", "calculation accuracy"],
  q3: ["function evaluation", "substitution", "arithmetic"],
};

export type SkillDiagnosisItem = {
  skill: string;
  total: number;
  correct: number;
  status: "strong" | "review" | "weak";
};

export function getQuestionSkills(question: GeneratedQuestion) {
  return skillBank[question.id] ?? inferSkills(question);
}

export function getSkillDiagnosis(session: FakeSessionState, questions: GeneratedQuestion[]) {
  const map = new Map<string, { total: number; correct: number }>();

  questions.forEach((question) => {
    const correct = isAnswerCorrect(question, session.answers[question.id]?.answer ?? "");
    getQuestionSkills(question).forEach((skill) => {
      const current = map.get(skill) ?? { total: 0, correct: 0 };
      map.set(skill, {
        total: current.total + 1,
        correct: current.correct + (correct ? 1 : 0),
      });
    });
  });

  return Array.from(map.entries()).map(([skill, value]) => {
    const ratio = value.correct / value.total;

    return {
      skill,
      ...value,
      status: ratio >= 0.8 ? "strong" : ratio >= 0.5 ? "review" : "weak",
    } satisfies SkillDiagnosisItem;
  });
}

export function getWeakSkills(session: FakeSessionState, questions: GeneratedQuestion[]) {
  return getSkillDiagnosis(session, questions).filter((item) => item.status !== "strong");
}

function inferSkills(question: GeneratedQuestion) {
  const prompt = question.prompt.toLowerCase();

  if (prompt.includes("function") || prompt.includes("f(")) {
    return ["function evaluation", "substitution", "arithmetic"];
  }

  if (prompt.includes("system")) {
    return ["systems of equations", "elimination", "linear equations"];
  }

  if (prompt.includes("root") || prompt.includes("quadratic")) {
    return ["quadratic formula", "polynomial roots", "algebraic reasoning"];
  }

  return fallbackSkills;
}
