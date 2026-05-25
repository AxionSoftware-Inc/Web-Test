import type { ConfidenceLevel, MasteryEvidence, PriorityLevel, QuestionDifficulty, TimeQuality, TopicMastery, TopicStatus } from "./types";

export function percent(part: number, total: number) {
  return total <= 0 ? 0 : Math.round((part / total) * 100);
}

export function clampPercent(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function getTimeQuality(timeSpentSeconds: number, estimatedSeconds: number): TimeQuality {
  if (!estimatedSeconds || estimatedSeconds <= 0 || !timeSpentSeconds || timeSpentSeconds <= 0) return "normal";
  const ratio = timeSpentSeconds / estimatedSeconds;
  if (ratio <= 0.35) return "too_fast";
  if (ratio <= 1.5) return "normal";
  if (ratio <= 3) return "slow";
  return "very_slow";
}

export function getDifficultyMultiplier(difficulty: QuestionDifficulty) {
  if (difficulty === "medium") return 1.35;
  if (difficulty === "hard") return 1.7;
  return 1;
}

export function getTimeMultiplier(correct: boolean, timeQuality: TimeQuality) {
  if (correct) {
    if (timeQuality === "normal") return 1;
    if (timeQuality === "slow") return 0.75;
    if (timeQuality === "very_slow") return 0.6;
    if (timeQuality === "too_fast") return 0.65;
  }
  if (timeQuality === "very_slow") return 1.25;
  if (timeQuality === "slow") return 1.1;
  if (timeQuality === "too_fast") return 0.85;
  return 1;
}

export function getEvidenceScore(evidence: MasteryEvidence) {
  const base = evidence.correct ? 1 : -1;
  const difficulty = getDifficultyMultiplier(evidence.difficulty);
  const time = getTimeMultiplier(evidence.correct, evidence.timeQuality);
  const fundamental = evidence.isFundamental && !evidence.correct ? 1.15 : 1;
  return base * difficulty * time * evidence.masteryWeight * fundamental;
}

export function getConfidence(attempts: number): ConfidenceLevel {
  if (attempts >= 15) return "high";
  if (attempts >= 6) return "medium";
  return "low";
}

export function getTopicStatus(attempts: number, accuracy: number, confidence: ConfidenceLevel, lastPracticedAt?: string, staleDays = 60): TopicStatus {
  if (attempts === 0) return "not_started";
  if (lastPracticedAt && accuracy >= 85 && isOlderThanDays(lastPracticedAt, staleDays)) return "stale";
  if (confidence === "low") return "learning";
  if (accuracy < 50) return "weak";
  if (accuracy < 70) return "needs_practice";
  if (accuracy < 85) return "good";
  if (accuracy >= 85 && (confidence === "medium" || confidence === "high")) return "mastered";
  return "learning";
}

export function calculateMastery(accuracy: number, confidence: ConfidenceLevel, averageTimeRatio: number) {
  let mastery = accuracy;
  if (confidence === "low") mastery *= 0.75;
  if (confidence === "medium") mastery *= 0.9;
  if (averageTimeRatio > 3) mastery *= 0.75;
  else if (averageTimeRatio > 2) mastery *= 0.85;
  return clampPercent(mastery);
}

export function getStudentTopicPriority(topic: Pick<TopicMastery, "wrong" | "mastery" | "confidence" | "isFundamental" | "status">) {
  let score = 0;
  score += topic.wrong * 2;
  score += Math.max(0, 70 - topic.mastery);
  if (topic.confidence === "high") score += 15;
  if (topic.confidence === "medium") score += 8;
  if (topic.isFundamental) score += 20;
  if (topic.status === "weak") score += 20;
  if (topic.status === "needs_practice") score += 10;
  return Math.round(score);
}

export function priorityFromScore(score: number): PriorityLevel {
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function calculateClassTopicSeverity(input: {
  wrong: number;
  affectedStudentCount: number;
  totalStudentCount: number;
  classAccuracy: number;
  isFundamental: boolean;
}) {
  let score = 0;
  score += input.wrong;
  score += input.affectedStudentCount * 2;
  if (input.classAccuracy < 50) score += 20;
  if (input.classAccuracy < 70) score += 10;
  if (input.isFundamental) score += 25;
  const affectedRatio = input.affectedStudentCount / Math.max(1, input.totalStudentCount);
  if (affectedRatio >= 0.75) score += 30;
  else if (affectedRatio >= 0.5) score += 20;
  return Math.round(score);
}

function isOlderThanDays(value: string, days: number) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp > days * 24 * 60 * 60 * 1000;
}
