import type { CognitiveLevel, QuestionDifficulty } from "./types";
import { getIRTItemParameters, irtItemInformation } from "./irt";

export type AdaptiveTestItem = {
  id: string | number;
  prompt: string;
  topicSlug: string;
  difficulty: QuestionDifficulty;
  cognitiveLevel?: CognitiveLevel;
  questionType?: string;
};

export type CATSessionState = {
  theta: number;             // O'quvchining joriy qobiliyati (-3.0 .. +3.0)
  standardError: number;     // O'lchov standart xatoligi SE
  answeredItemIds: Set<string | number>;
  topicFrequencies: Map<string, number>;
  totalAnswered: number;
  minItems?: number;
  maxItems?: number;
  targetStandardError?: number;
};

export type CATDecision = {
  isTestComplete: boolean;
  stopReason?: "target_precision_reached" | "max_items_reached" | "item_bank_exhausted";
  nextItem?: AdaptiveTestItem;
  currentTheta: number;
  currentStandardError: number;
  itemsAnsweredCount: number;
  precisionPercent: number; // 0% dan 100% gacha (1 - SE / initialSE)
};

/**
 * Computerized Adaptive Testing (CAT) bo'yicha navbatdagi eng optimal savolni tanlash
 * yoki testni to'xtatish to'g'risida qaror qabul qilish (Stopping Rule).
 */
export function evaluateAdaptiveNextStep(
  itemBank: AdaptiveTestItem[],
  state: CATSessionState
): CATDecision {
  const minItems = state.minItems ?? 6;
  const maxItems = state.maxItems ?? 15;
  const targetSE = state.targetStandardError ?? 0.35;

  const totalAnswered = state.totalAnswered;
  const se = state.standardError;
  const precisionPercent = Math.min(100, Math.round(Math.max(0, (1 - se / 1.0) * 100)));

  // 1. To'xtatish shartlari tekshiruvi (Stopping Criteria)
  if (totalAnswered >= minItems && se <= targetSE) {
    return {
      isTestComplete: true,
      stopReason: "target_precision_reached",
      currentTheta: state.theta,
      currentStandardError: se,
      itemsAnsweredCount: totalAnswered,
      precisionPercent: 100,
    };
  }

  if (totalAnswered >= maxItems) {
    return {
      isTestComplete: true,
      stopReason: "max_items_reached",
      currentTheta: state.theta,
      currentStandardError: se,
      itemsAnsweredCount: totalAnswered,
      precisionPercent,
    };
  }

  // 2. Ishlanmagan mavjud savollar
  const availableItems = itemBank.filter((item) => !state.answeredItemIds.has(item.id));
  if (!availableItems.length) {
    return {
      isTestComplete: true,
      stopReason: "item_bank_exhausted",
      currentTheta: state.theta,
      currentStandardError: se,
      itemsAnsweredCount: totalAnswered,
      precisionPercent,
    };
  }

  // 3. Maximum Fisher Information + Content Balancing bo'yicha eng optimal savolni topish
  let bestItem = availableItems[0];
  let maxScore = -Infinity;

  for (const item of availableItems) {
    const params = getIRTItemParameters(item.difficulty, item.questionType);
    const info = irtItemInformation(state.theta, params);

    // Content Balancing: agar ushbu mavzu allaqachon ko'p so'ralgan bo'lsa, penalti
    const topicUsage = state.topicFrequencies.get(item.topicSlug) ?? 0;
    const balancePenalty = 1 / (1 + topicUsage * 0.4);

    // Kognitiv rang-baranglik imtiyozi (agar analytical yoki conceptual bo'lsa)
    const cognitiveBonus = item.cognitiveLevel === "analytical" || item.cognitiveLevel === "conceptual" ? 1.15 : 1.0;

    const totalScore = info * balancePenalty * cognitiveBonus;

    if (totalScore > maxScore) {
      maxScore = totalScore;
      bestItem = item;
    }
  }

  return {
    isTestComplete: false,
    nextItem: bestItem,
    currentTheta: state.theta,
    currentStandardError: se,
    itemsAnsweredCount: totalAnswered,
    precisionPercent,
  };
}
