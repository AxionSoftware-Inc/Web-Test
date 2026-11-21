import {
  calculateClassTopicSeverity,
  calculateAdvancedMastery,
  calculateMastery,
  getConfidence,
  getStudentTopicPriority,
  getTimeQuality,
  getTopicStatus,
  percent,
  priorityFromScore,
} from "./scoring";
import { algebraTopicGraph, createTopicGraph, findWeakPrerequisite, getSubjectTopicGraph } from "./topic-graph";
import { traceKnowledgeSequence } from "./bkt";
import { estimateAbilityEAP } from "./irt";
import { analyzeCognitiveDepth } from "./depth-analyzer";
import { diagnoseMistakePattern } from "./distractor-analyzer";
import { calculateRetentionState } from "./decay-engine";
import { buildLearningPathSummary } from "./learning-path";
import { analyzeTelemetryIntegrity } from "./telemetry-cheat-detector";
import type {
  ClassTopicWeakness,
  DepthStatus,
  MasteryReport,
  PracticeBlueprintItem,
  RecommendedAction,
  SessionAnswerSnapshot,
  SkillMastery,
  StudentMistake,
  TopicMastery,
  TopicNode,
} from "./types";

type EngineOptions = {
  generatedAt?: string;
  topicGraph?: TopicNode[];
  practiceBaseHref?: string;
  lessonBaseHref?: string;
  retestBaseHref?: string;
};

type AggregateRow = {
  subject: string;
  label: string;
  slug: string;
  topicSlug: string;
  attempts: number;
  correct: number;
  wrong: number;
  timeTotal: number;
  expectedTimeTotal: number;
  isFundamental: boolean;
  prerequisites: Set<string>;
  lastPracticedAt?: string;
  answers: SessionAnswerSnapshot[];
};

export function buildMasteryReport(
  studentId: string,
  answers: SessionAnswerSnapshot[],
  options: EngineOptions = {}
): MasteryReport {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const studentAnswers = answers.filter((answer) => answer.studentId === studentId);
  const subject = studentAnswers[0]?.subject || "Algebra";
  const topicGraphNodes = options.topicGraph ?? getSubjectTopicGraph(subject);

  const topics = buildTopicMastery(studentId, studentAnswers, { ...options, topicGraph: topicGraphNodes });
  const skills = buildSkillMastery(studentId, studentAnswers, options);
  const mistakes = buildStudentMistakes(studentAnswers, topics, options);

  const weakTopics = topics
    .filter((topic) => topic.status === "weak" || topic.status === "needs_practice" || topic.mastery < 70)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const masteredTopics = topics
    .filter((topic) => topic.status === "mastered")
    .sort((a, b) => b.mastery - a.mastery);

  const decayedTopics = topics
    .filter((topic) => topic.retention.isDecayed)
    .sort((a, b) => a.retention.retentionScore - b.retention.retentionScore);

  // Butun o'quvchi profili bo'yicha umumiy chuqurlik holati
  const overallDepth = calculateOverallDepth(topics);

  // O'quvchining yo'l xaritasidagi joriy o'rni va keyingi chegarasi
  const learningPath = buildLearningPathSummary({
    subject,
    topicMasteries: topics,
    topicGraphNodes,
  });

  const recommendedActions = buildStudentRecommendations(topics, options);
  const practiceBlueprint = buildPracticeBlueprint(topics, weakTopics, options);

  // Telemetriya va test halolligi (Cheat & Telemetry Integrity) tahlili
  const telemetryResults = studentAnswers.map((a) =>
    analyzeTelemetryIntegrity({
      isCorrect: a.isCorrect,
      timeSpentSeconds: a.timeSpentSeconds,
      estimatedSeconds: a.estimatedSeconds,
      tabSwitchCount: a.tabSwitchCountDuringQuestion,
      changedCount: a.changedCount,
      difficulty: a.difficulty,
    })
  );

  const testIntegrityScore = telemetryResults.length
    ? Math.round((telemetryResults.reduce((s, r) => s + r.integrityScore, 0) / telemetryResults.length) * 100)
    : 100;

  const integrityFlags = Array.from(new Set(telemetryResults.filter((r) => r.behaviorFlag !== "clean").map((r) => r.behaviorFlag)));

  return {
    studentId,
    generatedAt,
    topics,
    skills,
    mistakes,
    weakTopics,
    masteredTopics,
    decayedTopics,
    overallDepth,
    learningPath,
    testIntegrityScore,
    integrityFlags,
    recommendedActions,
    practiceBlueprint,
  };
}

export function buildTopicMastery(
  studentId: string,
  answers: SessionAnswerSnapshot[],
  options: EngineOptions = {}
): TopicMastery[] {
  const graphNodes = options.topicGraph ?? algebraTopicGraph;
  const graph = createTopicGraph(graphNodes);
  const rows = new Map<string, AggregateRow>();

  answers.forEach((answer) => {
    const node = graph.get(answer.topicSlug);
    const row = rows.get(answer.topicSlug) ?? {
      subject: answer.subject,
      label: node?.title ?? answer.topic,
      slug: answer.topicSlug,
      topicSlug: answer.topicSlug,
      attempts: 0,
      correct: 0,
      wrong: 0,
      timeTotal: 0,
      expectedTimeTotal: 0,
      isFundamental: answer.isFundamental || graph.isFundamental(answer.topicSlug),
      prerequisites: new Set([...answer.prerequisites, ...graph.prerequisites(answer.topicSlug)]),
      answers: [],
    };
    row.attempts += 1;
    row.correct += answer.isCorrect ? 1 : 0;
    row.wrong += answer.isCorrect ? 0 : 1;
    row.timeTotal += positive(answer.timeSpentSeconds);
    row.expectedTimeTotal += positive(answer.estimatedSeconds);
    row.lastPracticedAt = maxDate(row.lastPracticedAt, answer.answeredAt);
    row.answers.push(answer);
    rows.set(answer.topicSlug, row);
  });

  return Array.from(rows.values())
    .map((row) => {
      const accuracy = percent(row.correct, row.attempts);
      const averageTimeSeconds = Math.round(row.timeTotal / Math.max(1, row.attempts));
      const expectedAverageTimeSeconds = Math.round(row.expectedTimeTotal / Math.max(1, row.attempts));
      const averageTimeRatio = expectedAverageTimeSeconds > 0 ? averageTimeSeconds / expectedAverageTimeSeconds : 1;

      // 1. Item Response Theory (IRT) - Yashirin qobiliyat theta va SE(theta)
      const irtEstimate = estimateAbilityEAP(
        row.answers.map((a) => ({
          isCorrect: a.isCorrect,
          difficulty: a.difficulty,
          questionType: "single_choice",
        }))
      );

      // 2. Bayesian Knowledge Tracing (BKT) ehtimolligini hisoblash
      const bktResult = traceKnowledgeSequence(
        row.answers.map((a) => ({
          isCorrect: a.isCorrect,
          difficulty: a.difficulty,
          questionType: "single_choice",
        }))
      );

      // 3. Kognitiv chuqurlik (Bloom Gradienti & Far Transfer) tahlili
      const depthAnalysis = analyzeCognitiveDepth(
        row.answers.map((a) => ({
          isCorrect: a.isCorrect,
          difficulty: a.difficulty,
          cognitiveLevel: a.cognitiveLevel,
          prompt: a.questionPreview,
        }))
      );

      // 4. Ebbinghaus unutish va esda saqlanish tahlili (Spaced Repetition Decay)
      const baseRawMastery = calculateMastery(accuracy, irtEstimate.confidence, averageTimeRatio);
      const retention = calculateRetentionState({
        mastery: baseRawMastery,
        attempts: row.attempts,
        lastPracticedAt: row.lastPracticedAt,
        referenceDate: options.generatedAt,
      });

      // 5. Advanced kompozit mastery hisoblash (IRT + BKT + Depth + Transfer)
      const mastery = calculateAdvancedMastery({
        accuracy,
        confidence: irtEstimate.confidence,
        averageTimeRatio,
        irtMasteryPercent: irtEstimate.masteryPercent,
        bktProbability: bktResult.finalProbability,
        depthScore: depthAnalysis.depthScore,
        isRoteMemorized: depthAnalysis.isRoteMemorized,
      });

      const hubScore = graph.getHubScore(row.topicSlug);
      const status = getTopicStatus(row.attempts, accuracy, irtEstimate.confidence, row.lastPracticedAt);

      const topic: TopicMastery = {
        studentId,
        subject: row.subject,
        topic: row.label,
        topicSlug: row.topicSlug,
        attempts: row.attempts,
        correct: row.correct,
        wrong: row.wrong,
        accuracy,
        mastery,
        bktProbability: bktResult.finalProbability,
        irtTheta: irtEstimate.theta,
        standardError: irtEstimate.standardError,
        hubScore,
        depthAnalysis,
        retention,
        averageTimeSeconds,
        expectedAverageTimeSeconds,
        confidence: irtEstimate.confidence,
        status,
        isFundamental: row.isFundamental,
        prerequisites: Array.from(row.prerequisites),
        lastPracticedAt: row.lastPracticedAt,
        updatedAt: row.lastPracticedAt ?? new Date().toISOString(),
        priorityScore: 0,
      };

      return {
        ...topic,
        priorityScore: getStudentTopicPriority({
          ...topic,
          hubScore,
          standardError: irtEstimate.standardError,
        }),
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function buildSkillMastery(
  studentId: string,
  answers: SessionAnswerSnapshot[],
  options: EngineOptions = {}
): SkillMastery[] {
  const rows = new Map<string, AggregateRow>();

  answers.forEach((answer) => {
    const skills = answer.skills.length ? answer.skills : ["general"];
    skills.forEach((skill) => {
      const key = `${answer.topicSlug}:${skill}`;
      const row = rows.get(key) ?? {
        subject: answer.subject,
        label: skill,
        slug: slugify(skill),
        topicSlug: answer.topicSlug,
        attempts: 0,
        correct: 0,
        wrong: 0,
        timeTotal: 0,
        expectedTimeTotal: 0,
        isFundamental: answer.isFundamental,
        prerequisites: new Set(answer.prerequisites),
        answers: [],
      };
      row.attempts += 1;
      row.correct += answer.isCorrect ? 1 : 0;
      row.wrong += answer.isCorrect ? 0 : 1;
      row.timeTotal += positive(answer.timeSpentSeconds);
      row.expectedTimeTotal += positive(answer.estimatedSeconds);
      row.lastPracticedAt = maxDate(row.lastPracticedAt, answer.answeredAt);
      rows.set(key, row);
    });
  });

  return Array.from(rows.values())
    .map((row): SkillMastery => {
      const accuracy = percent(row.correct, row.attempts);
      const confidence = getConfidence(row.attempts);
      const averageTimeRatio = row.expectedTimeTotal > 0 ? row.timeTotal / row.expectedTimeTotal : 1;
      const mastery = calculateMastery(accuracy, confidence, averageTimeRatio);
      return {
        studentId,
        subject: row.subject,
        skill: row.label,
        skillSlug: row.slug,
        topicSlug: row.topicSlug,
        attempts: row.attempts,
        correct: row.correct,
        wrong: row.wrong,
        accuracy,
        mastery,
        confidence,
        status: getTopicStatus(row.attempts, accuracy, confidence, row.lastPracticedAt),
        updatedAt: row.lastPracticedAt ?? options.generatedAt ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => a.mastery - b.mastery);
}

export function buildStudentMistakes(
  answers: SessionAnswerSnapshot[],
  topics: TopicMastery[],
  options: EngineOptions = {}
): StudentMistake[] {
  return answers
    .filter((answer) => !answer.isCorrect)
    .map((answer): StudentMistake => {
      const topic = topics.find((item) => item.topicSlug === answer.topicSlug);
      const priorityScore = topic?.priorityScore ?? answer.masteryWeight * 20;
      const timeQuality = getTimeQuality(answer.timeSpentSeconds, answer.estimatedSeconds);

      // Avtomatik xato sababi va tashxisi (Distractor/Misconception diagnosis)
      const diagnosis = diagnoseMistakePattern({
        studentAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        timeSpentSeconds: answer.timeSpentSeconds,
        estimatedSeconds: answer.estimatedSeconds,
        timeQuality,
        difficulty: answer.difficulty,
        questionPrompt: answer.questionPreview,
        options: answer.questionOptions,
      });

      return {
        id: `${answer.sessionId}-${answer.questionId}`,
        studentId: answer.studentId,
        sessionId: answer.sessionId,
        testId: answer.testId,
        questionId: answer.questionId,
        subject: answer.subject,
        topic: answer.topic,
        topicSlug: answer.topicSlug,
        skills: answer.skills,
        questionTitle: answer.questionTitle,
        questionPreview: answer.questionPreview,
        studentAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        explanation: answer.explanation,
        difficulty: answer.difficulty,
        cognitiveLevel: answer.cognitiveLevel,
        timeSpentSeconds: answer.timeSpentSeconds,
        estimatedSeconds: answer.estimatedSeconds,
        timeQuality,
        status: "new",
        priority: priorityFromScore(priorityScore),
        mistakeType: diagnosis.mistakeType,
        misconceptionReason: diagnosis.misconceptionReason,
        remedialTip: diagnosis.remedialTip,
        recommendedAction: actionForTopic(answer.topic, answer.topicSlug, priorityFromScore(priorityScore), options),
        createdAt: answer.answeredAt,
      };
    })
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

export function buildStudentRecommendations(
  topics: TopicMastery[],
  options: EngineOptions = {}
): RecommendedAction[] {
  const weakTopics = topics
    .filter((topic) => topic.status === "weak" || topic.status === "needs_practice" || topic.mastery < 70)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const shallowTopics = topics.filter((topic) => topic.depthAnalysis.depthStatus === "shallow" && topic.mastery >= 50);
  const decayedTopics = topics.filter((topic) => topic.retention.isDecayed);

  if (!weakTopics.length && !shallowTopics.length && !decayedTopics.length) {
    return [
      {
        type: "next_assigned",
        label: "Keyingi belgilangan testni boshlash",
        href: "/student/tests",
        reason: "Barcha asosiy mavzular yetarli darajada o'zlashtirilgan.",
        priority: "low",
      } satisfies RecommendedAction,
    ];
  }

  const recommendations: RecommendedAction[] = [];

  // 1. Zaif mavzular va ularning poydevorlari (Prerequisites)
  weakTopics.slice(0, 4).forEach((topic) => {
    const prerequisite = findWeakPrerequisite(topic, topics, options.topicGraph ?? algebraTopicGraph);
    const target = prerequisite ?? topic;
    const priority = priorityFromScore(Math.max(topic.priorityScore, target.priorityScore));
    recommendations.push({
      ...actionForTopic(target.topic, target.topicSlug, priority, options),
      reason: prerequisite
        ? `${topic.topic} mavzusida qiyinchilik bor, ammo uning poydevori bo'lgan ${prerequisite.topic} oldin mustahkamlanishi shart.`
        : `${topic.correct}/${topic.attempts} to'g'ri (${topic.accuracy}% aniqlik, ${topic.depthAnalysis.depthStatus} chuqurlik).`,
    });
  });

  // 2. Sayoz o'rganilgan mavzular uchun tahliliy amaliyot
  shallowTopics.slice(0, 2).forEach((topic) => {
    recommendations.push({
      type: "practice",
      label: `${topic.topic}: Tahliliy mashq`,
      href: `${options.practiceBaseHref ?? "/practice"}/${topic.topicSlug}`,
      reason: `${topic.topic} qoidalari esda bor, lekin amaliy misollarni yechish ko'nikmasi sayoz.`,
      topicSlug: topic.topicSlug,
      priority: "medium",
    });
  });

  // 3. Xotirada so'ngan mavzularni takrorlash (Spaced Repetition)
  decayedTopics.slice(0, 2).forEach((topic) => {
    recommendations.push({
      type: "maintenance",
      label: `${topic.topic}: Xotirani yangilash`,
      href: `${options.practiceBaseHref ?? "/practice"}/${topic.topicSlug}`,
      reason: `Oxirgi mashqdan beri ${topic.retention.daysSincePractice} kun o'tdi. Unutishning oldini olish uchun 3-5 ta savol yeching.`,
      topicSlug: topic.topicSlug,
      priority: "medium",
    });
  });

  return dedupeActions(recommendations);
}

export function buildPracticeBlueprint(
  topics: TopicMastery[],
  weakTopics: TopicMastery[],
  options: EngineOptions = {}
): PracticeBlueprintItem[] {
  const mastered = topics.filter((topic) => topic.status === "mastered" || topic.mastery >= 85);
  const lowConfidence = topics.filter((topic) => topic.confidence === "low" && topic.attempts > 0);
  const prerequisites = weakTopics
    .flatMap((topic) => findWeakPrerequisite(topic, topics, options.topicGraph ?? algebraTopicGraph) ?? [])
    .filter(Boolean);
  const items: PracticeBlueprintItem[] = [];

  weakTopics
    .slice(0, 3)
    .forEach((topic) =>
      items.push({
        topicSlug: topic.topicSlug,
        topic: topic.topic,
        ratio: 0.4 / Math.max(1, Math.min(3, weakTopics.length)),
        reason: "weak_topic",
      })
    );

  prerequisites
    .slice(0, 2)
    .forEach((topic) =>
      items.push({
        topicSlug: topic.topicSlug,
        topic: topic.topic,
        ratio: 0.2 / Math.max(1, Math.min(2, prerequisites.length)),
        reason: "prerequisite",
      })
    );

  lowConfidence
    .slice(0, 2)
    .forEach((topic) =>
      items.push({
        topicSlug: topic.topicSlug,
        topic: topic.topic,
        ratio: 0.1 / Math.max(1, Math.min(2, lowConfidence.length)),
        reason: "low_confidence",
      })
    );

  mastered
    .slice(0, 2)
    .forEach((topic) =>
      items.push({
        topicSlug: topic.topicSlug,
        topic: topic.topic,
        ratio: 0.1 / Math.max(1, Math.min(2, mastered.length)),
        reason: "maintenance",
      })
    );

  return normalizeBlueprint(items);
}

export function buildClassTopicWeakness(
  classId: string,
  answers: SessionAnswerSnapshot[],
  totalStudentCount?: number
): ClassTopicWeakness[] {
  const classAnswers = answers.filter((answer) => answer.classId === classId || answer.visibility === "class");
  const studentIds = new Set(classAnswers.map((answer) => answer.studentId));
  const totalStudents = totalStudentCount ?? studentIds.size;
  const topicRows = new Map<
    string,
    {
      subject: string;
      topic: string;
      attempts: number;
      correct: number;
      wrong: number;
      isFundamental: boolean;
      prerequisites: Set<string>;
      affectedStudentIds: Set<string>;
    }
  >();

  classAnswers.forEach((answer) => {
    const row = topicRows.get(answer.topicSlug) ?? {
      subject: answer.subject,
      topic: answer.topic,
      attempts: 0,
      correct: 0,
      wrong: 0,
      isFundamental: answer.isFundamental,
      prerequisites: new Set(answer.prerequisites),
      affectedStudentIds: new Set<string>(),
    };
    row.attempts += 1;
    row.correct += answer.isCorrect ? 1 : 0;
    row.wrong += answer.isCorrect ? 0 : 1;
    if (!answer.isCorrect) row.affectedStudentIds.add(answer.studentId);
    topicRows.set(answer.topicSlug, row);
  });

  return Array.from(topicRows.entries())
    .map(([topicSlug, row]): ClassTopicWeakness => {
      const classAccuracy = percent(row.correct, row.attempts);
      const severityScore = calculateClassTopicSeverity({
        wrong: row.wrong,
        affectedStudentCount: row.affectedStudentIds.size,
        totalStudentCount: totalStudents,
        classAccuracy,
        isFundamental: row.isFundamental,
      });
      const severity = priorityFromScore(severityScore);
      return {
        classId,
        subject: row.subject,
        topic: row.topic,
        topicSlug,
        attempts: row.attempts,
        correct: row.correct,
        wrong: row.wrong,
        classAccuracy,
        classMastery: calculateMastery(classAccuracy, getConfidence(row.attempts), 1),
        affectedStudentCount: row.affectedStudentIds.size,
        totalStudentCount: totalStudents,
        isFundamental: row.isFundamental,
        prerequisites: Array.from(row.prerequisites),
        severity,
        severityScore,
        affectedStudentIds: Array.from(row.affectedStudentIds),
        recommendedAction: {
          type: severity === "high" ? "lesson" : "practice",
          label: severity === "high" ? `Review ${row.topic} in class` : `Assign ${row.topic} practice`,
          href: `/teacher/classes/${classId}/assign`,
          reason: `${row.wrong} wrong answers, ${row.affectedStudentIds.size}/${totalStudents} students affected.`,
          topicSlug,
          priority: severity,
        },
      };
    })
    .sort((a, b) => b.severityScore - a.severityScore);
}

function calculateOverallDepth(topics: TopicMastery[]): DepthStatus {
  if (!topics.length) return "fragile";
  const deepCount = topics.filter((t) => t.depthAnalysis.depthStatus === "deep").length;
  const shallowCount = topics.filter((t) => t.depthAnalysis.depthStatus === "shallow").length;
  const proceduralCount = topics.filter((t) => t.depthAnalysis.depthStatus === "procedural").length;

  if (deepCount > topics.length / 2) return "deep";
  if (shallowCount > topics.length / 3) return "shallow";
  if (proceduralCount >= shallowCount) return "procedural";
  return "fragile";
}

function actionForTopic(
  topic: string,
  topicSlug: string,
  priority: "low" | "medium" | "high",
  options: EngineOptions
): RecommendedAction {
  return {
    type: priority === "high" ? "practice" : "review",
    label: priority === "high" ? `${topic}: Qayta mashq qilish` : `${topic}: Takrorlash`,
    href: `${options.practiceBaseHref ?? "/practice"}/${topicSlug}`,
    reason: `${topic} bo'yicha diagnostika natijalariga asosan mustahkamlash zarur.`,
    topicSlug,
    priority,
  };
}

function normalizeBlueprint(items: PracticeBlueprintItem[]) {
  const merged = new Map<string, PracticeBlueprintItem>();
  items.forEach((item) => {
    const current = merged.get(item.topicSlug);
    merged.set(item.topicSlug, current ? { ...current, ratio: current.ratio + item.ratio } : item);
  });
  const rows = Array.from(merged.values());
  const total = rows.reduce((sum, item) => sum + item.ratio, 0);
  if (!total) return [];
  return rows.map((item) => ({ ...item, ratio: Number((item.ratio / total).toFixed(2)) }));
}

function dedupeActions(actions: RecommendedAction[]) {
  const map = new Map<string, RecommendedAction>();
  actions.forEach((action) => {
    if (!action.topicSlug || !map.has(action.topicSlug)) map.set(action.topicSlug ?? action.href, action);
  });
  return Array.from(map.values()).sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

function priorityWeight(priority: "low" | "medium" | "high") {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function positive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function maxDate(current: string | undefined, next: string) {
  if (!current) return next;
  return Date.parse(next) > Date.parse(current) ? next : current;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";
}
