import type { QuestionDifficulty } from "./types";

export type BehaviorAnomalyFlag =
  | "clean"
  | "suspected_lookup"   // Internetdan qidirish (tab switch + tashqarida uzoq turib, tez to'g'ri belgilash)
  | "blind_guess"        // O'qimasdan tavakkal bosish (o'ta tez bosilgan qiyin savol)
  | "high_hesitation"    // Kuchli ikkilanish (variantni bir necha bor almashtirish)
  | "idle_abandonment";  // Uzoq vaqt harakatsizlik

export type TelemetryIntegrityResult = {
  integrityScore: number;     // 0.0 (ishonchsiz) dan 1.0 (to'liq halol) gacha
  behaviorFlag: BehaviorAnomalyFlag;
  discountedWeight: number;   // Psixometrik IRT/BKT modellariga ta'sir og'irligi (0.05 - 1.0)
  explanation: string;
};

/**
 * Test ishlash jarayonidagi telemetriya (vaqt, tab switch, javob almashtirish) anomaliyalarini aniqlash
 */
export function analyzeTelemetryIntegrity(input: {
  isCorrect: boolean;
  timeSpentSeconds: number;
  estimatedSeconds: number;
  tabSwitchCount?: number;
  outOfTabSeconds?: number;
  changedCount?: number;
  difficulty: QuestionDifficulty;
}): TelemetryIntegrityResult {
  const tabSwitches = input.tabSwitchCount ?? 0;
  const outOfTabSec = input.outOfTabSeconds ?? 0;
  const changed = input.changedCount ?? 0;
  const spent = Math.max(1, input.timeSpentSeconds);
  const estimated = Math.max(10, input.estimatedSeconds);
  const timeRatio = spent / estimated;

  // 1. Shubhali qidiruv (Suspected Lookup / Cheating)
  // Masalan: boshqa tabga o'tgan (kamida 1 marta), tashqarida 12+ soniya bo'lgan va javob to'g'ri chiqqan
  if (input.isCorrect && (tabSwitches >= 2 || (tabSwitches >= 1 && outOfTabSec >= 15))) {
    return {
      integrityScore: 0.20,
      behaviorFlag: "suspected_lookup",
      discountedWeight: 0.15, // Bu to'g'ri javob bilimni sun'iy oshirib yubormasligi uchun 85% diskontlanadi
      explanation: "Shubhali qidiruv signali: Savol paytida boshqa oynaga o'tilib, uzoq vaqt tutilgan va to'g'ri javob belgilangan.",
    };
  }

  // 2. Tavakkal topish / Ko'r-ko'rona bosish (Blind Guessing)
  // Qiyin yoki o'rtacha savolga 4 soniyadan kam vaqtda javob berilgan
  if (spent <= 4 && (input.difficulty === "hard" || input.difficulty === "medium")) {
    const integrity = input.isCorrect ? 0.35 : 0.60;
    return {
      integrityScore: integrity,
      behaviorFlag: "blind_guess",
      discountedWeight: input.isCorrect ? 0.25 : 0.70, // Tasodifiy to'g'ri topish bo'lsa diskont
      explanation: "Tavakkal bosish signali: Savol shartini to'liq o'qishga jismonan ulgurmay o'ta tez variant tanlangan.",
    };
  }

  // 3. Kuchli ikkilanish va variantlarni tinimsiz almashtirish (High Hesitation)
  if (changed >= 4) {
    return {
      integrityScore: 0.70,
      behaviorFlag: "high_hesitation",
      discountedWeight: 0.75,
      explanation: "Kuchli ikkilanish: Foydalanuvchi variantlar orasida 4+ marta adashib-almashtirgan, bilim hali qat'iy emas.",
    };
  }

  // 4. Uzoq vaqt harakatsiz turib qolish (Idle Abandonment)
  if (timeRatio > 4.5 && spent > 240) {
    return {
      integrityScore: 0.65,
      behaviorFlag: "idle_abandonment",
      discountedWeight: 0.60,
      explanation: "Harakatsizlik anomaliyasi: Savolda kutilganidan 4.5 barobar ko'p vaqt ushlanib qolingan.",
    };
  }

  // 5. Toza, halol va tabiiy faollik (Clean Natural Attempt)
  return {
    integrityScore: 1.0,
    behaviorFlag: "clean",
    discountedWeight: 1.0,
    explanation: "Tabiiy va ishonchli yechim: Hech qanday xulq-atvor anomaliyalari kuzatilmadi.",
  };
}
