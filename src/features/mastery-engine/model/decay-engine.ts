import type { RetentionState } from "./types";

/**
 * Ebbinghaus unutish egri chizig'i (Forgetting curve) asosida xotirada saqlanish darajasini hisoblash
 * R(t) = e^(-t / S)
 * S (Stability) — mavzuning xotiradagi barqarorligi (kunlarda)
 */
export function calculateRetentionState(input: {
  mastery: number;
  attempts: number;
  lastPracticedAt?: string;
  referenceDate?: string;
}): RetentionState {
  const now = input.referenceDate ? Date.parse(input.referenceDate) : Date.now();
  const lastTime = input.lastPracticedAt ? Date.parse(input.lastPracticedAt) : NaN;

  // Agar hali biror marta mashq qilinmagan bo'lsa
  if (Number.isNaN(lastTime) || input.attempts === 0) {
    return {
      retentionScore: 0,
      stabilityDays: 1,
      daysSincePractice: 0,
      isDecayed: false,
      recommendedReviewDate: new Date(now).toISOString(),
    };
  }

  const daysSince = Math.max(0, (now - lastTime) / (1000 * 60 * 60 * 24));

  // Barqarorlik omili (Stability S): mastery va takrorlashlar soniga qarab 3 kundan 120 kungacha o'sadi
  // S = base * (attempts factor) * (mastery factor)
  const masteryFactor = Math.max(0.2, input.mastery / 100);
  const attemptsFactor = Math.min(3.5, 1 + Math.log2(Math.max(1, input.attempts)));
  const stabilityDays = Math.max(2, Math.round(14 * masteryFactor * attemptsFactor));

  // Ebbinghaus eksponensial so'nish formulasi
  const decayRate = daysSince / stabilityDays;
  const retention = Math.exp(-decayRate);
  const retentionScore = Math.round(Math.max(5, Math.min(100, retention * input.mastery)));

  // Agar retention 70% dan pastga tushsa yoki 45 kundan ortiq takrorlanmagan bo'lsa
  const isDecayed = retentionScore < 70 && input.mastery >= 70;

  // Keyingi takrorlash tavsiya qilinadigan sana (retention ~75% ga tushadigan vaqt)
  // t_target = -S * ln(0.75) ≈ 0.287 * S
  const targetDays = Math.max(1, Math.round(stabilityDays * 0.287));
  const reviewTimestamp = lastTime + targetDays * 24 * 60 * 60 * 1000;
  const recommendedReviewDate = new Date(reviewTimestamp).toISOString();

  return {
    retentionScore,
    stabilityDays,
    daysSincePractice: Number(daysSince.toFixed(1)),
    isDecayed,
    recommendedReviewDate,
  };
}
