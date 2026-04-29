export type GeneratedQuestionType = "multiple-choice" | "short-answer";
export type TestSubject = "mathematics" | "physics" | "programming";
export type TestDifficulty = "beginner" | "intermediate" | "advanced";

export type GeneratedQuestion = {
  id: string;
  type: GeneratedQuestionType;
  prompt: string;
  options: string[];
  answer?: string;
  explanation?: string;
  source: string;
};

export type LatexTestSource = {
  id: string;
  title: string;
  subject: TestSubject;
  category: string;
  difficulty: TestDifficulty;
  estimatedMinutes: number;
  latex: string;
};

export type TestGeneratorStats = {
  total: number;
  multipleChoice: number;
  shortAnswer: number;
};

export type TestAnswerMap = Record<string, string>;
