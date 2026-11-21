import type { QuestionDifficulty, QuestionLevel } from "./types";
import { estimateAbilityEAP } from "./irt";

export type PlacementQuestion = {
  id: string | number;
  prompt: string;
  topicSlug: string;
  difficulty: QuestionDifficulty;
  targetB: number; // IRT qiyinlik nishoni (-2.0 dan +2.0 gacha)
};

export type PlacementResult = {
  initialTheta: number;
  initialMasteryPercent: number;
  calibratedLevel: QuestionLevel;
  recommendedStartingTopicSlug: string;
  confidenceScore: number;
  summary: string;
};

/**
 * Binar qidiruv (Binary Search on Difficulty Lattice) asosidagi 5 savolli tezkor Cold-Start joylashtirish mexanizmi.
 */
export function evaluatePlacementBlitz(
  responses: Array<{
    questionId: string | number;
    topicSlug: string;
    difficulty: QuestionDifficulty;
    isCorrect: boolean;
  }>,
  availableQuestions: PlacementQuestion[]
): { isComplete: boolean; nextQuestion?: PlacementQuestion; result?: PlacementResult } {
  // 1. Agar hali birorta savol ishlanmagan bo'lsa -> O'rtacha (medium, b ≈ 0.0) savoldan boshlaymiz
  if (!responses.length) {
    const starter = availableQuestions.find((q) => q.difficulty === "medium") ?? availableQuestions[0];
    return { isComplete: false, nextQuestion: starter };
  }

  // 2. Maksimal 5 ta savol bilan to'liq joylashtiramiz
  if (responses.length >= 5) {
    const irtEstimate = estimateAbilityEAP(
      responses.map((r) => ({
        isCorrect: r.isCorrect,
        difficulty: r.difficulty,
      }))
    );

    let calibratedLevel: QuestionLevel = "intermediate";
    if (irtEstimate.theta <= -0.7) calibratedLevel = "beginner";
    else if (irtEstimate.theta >= 0.8) calibratedLevel = "advanced";

    // Eng ko'p xato qilingan yoki poydevor mavzuni boshlang'ich nuqta qilib tanlash
    const wrongResponses = responses.filter((r) => !r.isCorrect);
    const recommendedStartingTopicSlug = wrongResponses[0]?.topicSlug ?? responses[0]?.topicSlug ?? "foundation";

    const confidenceScore = Math.min(100, Math.round((1 - irtEstimate.standardError / 1.0) * 100));

    return {
      isComplete: true,
      result: {
        initialTheta: irtEstimate.theta,
        initialMasteryPercent: irtEstimate.masteryPercent,
        calibratedLevel,
        recommendedStartingTopicSlug,
        confidenceScore,
        summary: `Joylashtirish diagnostikasi yakunlandi: ${calibratedLevel.toUpperCase()} daraja (boshlang'ich qobiliyat: ${irtEstimate.theta > 0 ? "+" : ""}${irtEstimate.theta}).`,
      },
    };
  }

  // 3. Oraliq qadamlar: O'quvchining joriy javobiga qarab binar qidiruv bo'yicha keyingi qiyinlikni tanlash
  const lastResponse = responses[responses.length - 1];
  const answeredIds = new Set(responses.map((r) => String(r.questionId)));
  const remaining = availableQuestions.filter((q) => !answeredIds.has(String(q.id)));

  if (!remaining.length) {
    // Agar savollar qolmagan bo'lsa, mavjud javoblar bilan yakunlash
    return evaluatePlacementBlitz(responses.concat([{ ...lastResponse, questionId: "done" }]), []);
  }

  // Binar qadam: To'g'ri topsa qiyinroq, xato qilsa osonroq
  let targetDifficulty: QuestionDifficulty = "medium";
  if (lastResponse.isCorrect) {
    targetDifficulty = lastResponse.difficulty === "easy" ? "medium" : "hard";
  } else {
    targetDifficulty = lastResponse.difficulty === "hard" ? "medium" : "easy";
  }

  const nextQuestion = remaining.find((q) => q.difficulty === targetDifficulty) ?? remaining[0];
  return { isComplete: false, nextQuestion };
}
