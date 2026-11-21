export type QuestionLevel = "beginner" | "intermediate" | "advanced";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type CognitiveLevel = "recall" | "procedural" | "conceptual" | "analytical";
export type DepthStatus = "shallow" | "fragile" | "procedural" | "deep";
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
  order?: number;
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
  cognitiveLevel?: CognitiveLevel;
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
  cognitiveLevel?: CognitiveLevel;
  questionOptions?: string[];
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
  cognitiveLevel?: CognitiveLevel;
  timeQuality: TimeQuality;
  masteryWeight: number;
  isFundamental: boolean;
  createdAt: string;
};

export type DepthAnalysis = {
  recallAccuracy: number;
  proceduralAccuracy: number;
  analyticalAccuracy: number;
  depthScore: number;
  depthStatus: DepthStatus;
  depthSummary: string;
  templateDiversityIndex?: number;
  cognitiveGradient?: number;
  transferIndex?: number;
  isRoteMemorized?: boolean;
};

export type RetentionState = {
  retentionScore: number;
  stabilityDays: number;
  daysSincePractice: number;
  isDecayed: boolean;
  recommendedReviewDate: string;
};

export type BKTParams = {
  pL0: number; // Prior knowledge probability
  pT: number;  // Transition/learn probability
  pG: number;  // Guess probability
  pS: number;  // Slip probability
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
  bktProbability: number;
  irtTheta?: number;
  standardError?: number;
  hubScore?: number;
  depthAnalysis: DepthAnalysis;
  retention: RetentionState;
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
  cognitiveLevel?: CognitiveLevel;
  timeSpentSeconds: number;
  estimatedSeconds: number;
  timeQuality: TimeQuality;
  status: MistakeStatus;
  priority: PriorityLevel;
  mistakeType: MistakeType;
  misconceptionReason?: string;
  remedialTip?: string;
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

export type LearningPathNode = {
  topicSlug: string;
  title: string;
  subject: string;
  level: "foundation" | "core" | "advanced";
  status: TopicStatus;
  depthStatus: DepthStatus;
  mastery: number;
  order: number;
  isCompleted: boolean;
  isCurrentFrontier: boolean;
  isBlocked: boolean;
  blockingPrerequisites: string[];
  whyNext: string;
};

export type LearningPathSummary = {
  subject: string;
  totalNodes: number;
  completedNodesCount: number;
  pathProgressPercent: number;
  currentFrontier: LearningPathNode[];
  nextRecommendedNode?: LearningPathNode;
  nodes: LearningPathNode[];
};

export type MasteryReport = {
  studentId: string;
  generatedAt: string;
  topics: TopicMastery[];
  skills: SkillMastery[];
  mistakes: StudentMistake[];
  weakTopics: TopicMastery[];
  masteredTopics: TopicMastery[];
  decayedTopics: TopicMastery[];
  overallDepth: DepthStatus;
  learningPath?: LearningPathSummary;
  testIntegrityScore?: number;
  integrityFlags?: string[];
  recommendedActions: RecommendedAction[];
  practiceBlueprint: PracticeBlueprintItem[];
};
