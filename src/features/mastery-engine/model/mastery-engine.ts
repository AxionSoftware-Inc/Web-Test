import { calculateClassTopicSeverity, calculateMastery, getConfidence, getStudentTopicPriority, getTimeQuality, getTopicStatus, percent, priorityFromScore } from "./scoring";
import { algebraTopicGraph, createTopicGraph, findWeakPrerequisite } from "./topic-graph";
import type {
  ClassTopicWeakness,
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
};

export function buildMasteryReport(studentId: string, answers: SessionAnswerSnapshot[], options: EngineOptions = {}): MasteryReport {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const studentAnswers = answers.filter((answer) => answer.studentId === studentId);
  const topics = buildTopicMastery(studentId, studentAnswers, options);
  const skills = buildSkillMastery(studentId, studentAnswers, options);
  const mistakes = buildStudentMistakes(studentAnswers, topics, options);
  const weakTopics = topics.filter((topic) => topic.status === "weak" || topic.status === "needs_practice" || topic.mastery < 70).sort((a, b) => b.priorityScore - a.priorityScore);
  const masteredTopics = topics.filter((topic) => topic.status === "mastered").sort((a, b) => b.mastery - a.mastery);
  const recommendedActions = buildStudentRecommendations(topics, options);
  const practiceBlueprint = buildPracticeBlueprint(topics, weakTopics, options);

  return {
    studentId,
    generatedAt,
    topics,
    skills,
    mistakes,
    weakTopics,
    masteredTopics,
    recommendedActions,
    practiceBlueprint,
  };
}

export function buildTopicMastery(studentId: string, answers: SessionAnswerSnapshot[], options: EngineOptions = {}) {
  const graph = createTopicGraph(options.topicGraph ?? algebraTopicGraph);
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
    };
    row.attempts += 1;
    row.correct += answer.isCorrect ? 1 : 0;
    row.wrong += answer.isCorrect ? 0 : 1;
    row.timeTotal += positive(answer.timeSpentSeconds);
    row.expectedTimeTotal += positive(answer.estimatedSeconds);
    row.lastPracticedAt = maxDate(row.lastPracticedAt, answer.answeredAt);
    rows.set(answer.topicSlug, row);
  });

  return Array.from(rows.values()).map((row) => {
    const accuracy = percent(row.correct, row.attempts);
    const averageTimeSeconds = Math.round(row.timeTotal / Math.max(1, row.attempts));
    const expectedAverageTimeSeconds = Math.round(row.expectedTimeTotal / Math.max(1, row.attempts));
    const confidence = getConfidence(row.attempts);
    const averageTimeRatio = expectedAverageTimeSeconds > 0 ? averageTimeSeconds / expectedAverageTimeSeconds : 1;
    const mastery = calculateMastery(accuracy, confidence, averageTimeRatio);
    const status = getTopicStatus(row.attempts, accuracy, confidence, row.lastPracticedAt);
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
      averageTimeSeconds,
      expectedAverageTimeSeconds,
      confidence,
      status,
      isFundamental: row.isFundamental,
      prerequisites: Array.from(row.prerequisites),
      lastPracticedAt: row.lastPracticedAt,
      updatedAt: row.lastPracticedAt ?? new Date().toISOString(),
      priorityScore: 0,
    };
    return { ...topic, priorityScore: getStudentTopicPriority(topic) };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

export function buildSkillMastery(studentId: string, answers: SessionAnswerSnapshot[], options: EngineOptions = {}) {
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

  return Array.from(rows.values()).map((row): SkillMastery => {
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
  }).sort((a, b) => a.mastery - b.mastery);
}

export function buildStudentMistakes(answers: SessionAnswerSnapshot[], topics: TopicMastery[], options: EngineOptions = {}) {
  return answers
    .filter((answer) => !answer.isCorrect)
    .map((answer): StudentMistake => {
      const topic = topics.find((item) => item.topicSlug === answer.topicSlug);
      const priorityScore = topic?.priorityScore ?? answer.masteryWeight * 20;
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
        timeSpentSeconds: answer.timeSpentSeconds,
        estimatedSeconds: answer.estimatedSeconds,
        timeQuality: getTimeQuality(answer.timeSpentSeconds, answer.estimatedSeconds),
        status: "new",
        priority: priorityFromScore(priorityScore),
        mistakeType: "unknown",
        recommendedAction: actionForTopic(answer.topic, answer.topicSlug, priorityFromScore(priorityScore), options),
        createdAt: answer.answeredAt,
      };
    })
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

export function buildStudentRecommendations(topics: TopicMastery[], options: EngineOptions = {}) {
  const weakTopics = topics.filter((topic) => topic.status === "weak" || topic.status === "needs_practice" || topic.mastery < 70).sort((a, b) => b.priorityScore - a.priorityScore);
  if (!weakTopics.length) {
    return [{
      type: "next_assigned",
      label: "Continue next assigned test",
      href: "/student/tests",
      reason: "No high-priority weak topic is currently detected.",
      priority: "low",
    } satisfies RecommendedAction];
  }

  const recommendations: RecommendedAction[] = [];
  weakTopics.slice(0, 5).forEach((topic) => {
    const prerequisite = findWeakPrerequisite(topic, topics, options.topicGraph ?? algebraTopicGraph);
    const target = prerequisite ?? topic;
    const priority = priorityFromScore(Math.max(topic.priorityScore, target.priorityScore));
    recommendations.push({
      ...actionForTopic(target.topic, target.topicSlug, priority, options),
      reason: prerequisite
        ? `${topic.topic} is weak, but ${prerequisite.topic} should be reviewed first because it is a prerequisite.`
        : `${topic.correct}/${topic.attempts} correct, ${topic.accuracy}% accuracy, ${topic.confidence} confidence.`,
    });
  });
  return dedupeActions(recommendations);
}

export function buildPracticeBlueprint(topics: TopicMastery[], weakTopics: TopicMastery[], options: EngineOptions = {}) {
  const mastered = topics.filter((topic) => topic.status === "mastered" || topic.mastery >= 85);
  const lowConfidence = topics.filter((topic) => topic.confidence === "low" && topic.attempts > 0);
  const prerequisites = weakTopics
    .flatMap((topic) => findWeakPrerequisite(topic, topics, options.topicGraph ?? algebraTopicGraph) ?? [])
    .filter(Boolean);
  const items: PracticeBlueprintItem[] = [];

  weakTopics.slice(0, 3).forEach((topic) => items.push({ topicSlug: topic.topicSlug, topic: topic.topic, ratio: 0.4 / Math.max(1, Math.min(3, weakTopics.length)), reason: "weak_topic" }));
  prerequisites.slice(0, 2).forEach((topic) => items.push({ topicSlug: topic.topicSlug, topic: topic.topic, ratio: 0.2 / Math.max(1, Math.min(2, prerequisites.length)), reason: "prerequisite" }));
  lowConfidence.slice(0, 2).forEach((topic) => items.push({ topicSlug: topic.topicSlug, topic: topic.topic, ratio: 0.1 / Math.max(1, Math.min(2, lowConfidence.length)), reason: "low_confidence" }));
  mastered.slice(0, 2).forEach((topic) => items.push({ topicSlug: topic.topicSlug, topic: topic.topic, ratio: 0.1 / Math.max(1, Math.min(2, mastered.length)), reason: "maintenance" }));

  return normalizeBlueprint(items);
}

export function buildClassTopicWeakness(classId: string, answers: SessionAnswerSnapshot[], totalStudentCount?: number) {
  const classAnswers = answers.filter((answer) => answer.classId === classId || answer.visibility === "class");
  const studentIds = new Set(classAnswers.map((answer) => answer.studentId));
  const totalStudents = totalStudentCount ?? studentIds.size;
  const topicRows = new Map<string, {
    subject: string;
    topic: string;
    attempts: number;
    correct: number;
    wrong: number;
    isFundamental: boolean;
    prerequisites: Set<string>;
    affectedStudentIds: Set<string>;
  }>();

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

  return Array.from(topicRows.entries()).map(([topicSlug, row]): ClassTopicWeakness => {
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
  }).sort((a, b) => b.severityScore - a.severityScore);
}

function actionForTopic(topic: string, topicSlug: string, priority: "low" | "medium" | "high", options: EngineOptions): RecommendedAction {
  return {
    type: priority === "high" ? "practice" : "review",
    label: priority === "high" ? `Practice ${topic}` : `Review ${topic}`,
    href: `${options.practiceBaseHref ?? "/practice"}/${topicSlug}`,
    reason: `${topic} needs targeted work based on current mastery signals.`,
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
