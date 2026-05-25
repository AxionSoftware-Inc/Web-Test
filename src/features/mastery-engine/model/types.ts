export type QuestionLevel = "beginner" | "intermediate" | "advanced";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type TimeQuality = "too_fast" | "normal" | "slow" | "very_slow";
export type ConfidenceLevel = "low" | "medium" | "high";
export type TopicStatus = "not_started" | "learning" | "weak" | "needs_practice" | "improving" | "good" | "mastered" | "stale";
export type MistakeStatus = "new" | "reviewed" | "practiced" | "mastered";
export type PriorityLevel = "low" | "medium" | "high";
export type MistakeType = "unknown" | "concept_gap" | "calculation_error" | "formula_misuse" | "sign_error" | "unit_error" | "reading_error";

export type TopicNode = {
  slug: string;
  title: string;
  subject: string;
  parentSlug?: string;
  level: "foundation" | "core" | "advanced";
  importance: "low" | "medium" | "high";
  prerequisites: string[];
};

export type QuestionMetadataSnapshot = {
  id: string;
  type: "single_choice" | "multiple_choice" | "short_answer";
  title?: string;
  body: string;
  options: string[];
  answer: string;
  explanation: string;
  subject: string;
  topic: string;
  topicSlug: string;
  skills: string[];
  level: QuestionLevel;
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  masteryWeight: number;
  isFundamental: boolean;
  prerequisites: string[];
  remediation?: {
    practiceSlug?: string;
    lessonSlug?: string;
  };
};

export type SessionAnswerSnapshot = {
  id: string;
  studentId: string;
  sessionId: string;
  testId: string;
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  answeredAt: string;
  subject: string;
  topic: string;
  topicSlug: string;
  skills: string[];
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  masteryWeight: number;
  isFundamental: boolean;
  prerequisites: string[];
  questionTitle?: string;
  questionPreview: string;
  explanation: string;
  changedCount?: number;
  tabSwitchCountDuringQuestion?: number;
  visibility?: "personal" | "class" | "school";
  classId?: string;
};

export type MasteryEvidence = {
  topicSlug: string;
  skillSlugs: string[];
  correct: boolean;
  difficulty: QuestionDifficulty;
  timeQuality: TimeQuality;
  masteryWeight: number;
  isFundamental: boolean;
  createdAt: string;
};

export type TopicMastery = {
  studentId: string;
  subject: string;
  topic: string;
  topicSlug: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  mastery: number;
  averageTimeSeconds: number;
  expectedAverageTimeSeconds: number;
  confidence: ConfidenceLevel;
  status: TopicStatus;
  isFundamental: boolean;
  prerequisites: string[];
  lastPracticedAt?: string;
  updatedAt: string;
  priorityScore: number;
};

export type SkillMastery = {
  studentId: string;
  subject: string;
  skill: string;
  skillSlug: string;
  topicSlug: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  mastery: number;
  confidence: ConfidenceLevel;
  status: TopicStatus;
  updatedAt: string;
};

export type RecommendedAction = {
  type: "review" | "practice" | "retest" | "lesson" | "maintenance" | "next_assigned";
  label: string;
  href: string;
  reason: string;
  topicSlug?: string;
  priority: PriorityLevel;
};

export type StudentMistake = {
  id: string;
  studentId: string;
  sessionId: string;
  testId: string;
  questionId: string;
  subject: string;
  topic: string;
  topicSlug: string;
  skills: string[];
  questionTitle?: string;
  questionPreview: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  timeSpentSeconds: number;
  estimatedSeconds: number;
  timeQuality: TimeQuality;
  status: MistakeStatus;
  priority: PriorityLevel;
  mistakeType: MistakeType;
  recommendedAction: RecommendedAction;
  createdAt: string;
  reviewedAt?: string;
};

export type ClassTopicWeakness = {
  classId: string;
  subject: string;
  topic: string;
  topicSlug: string;
  attempts: number;
  correct: number;
  wrong: number;
  classAccuracy: number;
  classMastery: number;
  affectedStudentCount: number;
  totalStudentCount: number;
  isFundamental: boolean;
  prerequisites: string[];
  severity: PriorityLevel;
  severityScore: number;
  affectedStudentIds: string[];
  recommendedAction: RecommendedAction;
};

export type PracticeBlueprintItem = {
  topicSlug: string;
  topic: string;
  ratio: number;
  reason: "weak_topic" | "current_topic" | "prerequisite" | "maintenance" | "low_confidence";
};

export type MasteryReport = {
  studentId: string;
  generatedAt: string;
  topics: TopicMastery[];
  skills: SkillMastery[];
  mistakes: StudentMistake[];
  weakTopics: TopicMastery[];
  masteredTopics: TopicMastery[];
  recommendedActions: RecommendedAction[];
  practiceBlueprint: PracticeBlueprintItem[];
};
