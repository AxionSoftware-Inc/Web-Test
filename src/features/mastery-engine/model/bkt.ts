import type { BKTParams, QuestionDifficulty } from "./types";

export const DEFAULT_BKT_PARAMS: BKTParams = {
  pL0: 0.20, // Prior: boshlang'ich bilim ehtimoli (20%)
  pT: 0.15,  // Transition: bitta savol/mashq orqali o'rganish ehtimoli (15%)
  pG: 0.20,  // Guess: tavakkal topish (4 ta variantli savol uchun 20-25%)
  pS: 0.08,  // Slip: bilib turib adashish (8%)
};

export function getAdaptiveBktParams(difficulty: QuestionDifficulty, questionType?: string): BKTParams {
  const base = { ...DEFAULT_BKT_PARAMS };

  // Savol formatiga qarab taxminan topish (guess) ehtimoli
  if (questionType === "short_answer") {
    base.pG = 0.03; // Ochiq savolda tasodifan topish ehtimoli deyarli 0
  } else if (questionType === "multiple_choice") {
    base.pG = 0.10; // Ko'p tanlovli (multiple-choice) savolda taxmin qilish qiyinroq
  } else {
    base.pG = 0.25; // 4 ta variantli oddiy test
  }

  // Savol qiyinligiga qarab sirpanish (slip) va o'rganish (learn) parametrlarini moslash
  if (difficulty === "hard") {
    base.pS = 0.14; // Qiyin savolda biladigan odam ham hisobda sirpanishi ehtimoli ko'proq
    base.pT = 0.22; // Murakkab savolni to'g'ri yechish orqali o'rganish sakrashi kattaroq
  } else if (difficulty === "easy") {
    base.pS = 0.04;
    base.pT = 0.10;
  }

  return base;
}

/**
 * BKT (Bayesian Knowledge Tracing) bo'yicha bitta javobdan so'ng bilim ehtimolligini yangilash.
 * Bayes formulasi:
 * P(L|correct) = (P(L) * (1 - pS)) / (P(L) * (1 - pS) + (1 - P(L)) * pG)
 * P(L|wrong)   = (P(L) * pS)       / (P(L) * pS       + (1 - P(L)) * (1 - pG))
 * So'ngra o'rganish sakrashi: P(L_next) = P(L|obs) + (1 - P(L|obs)) * pT
 */
export function updateKnowledgeProbability(
  currentPL: number,
  isCorrect: boolean,
  params: BKTParams = DEFAULT_BKT_PARAMS
): number {
  const pL = Math.max(0.001, Math.min(0.999, currentPL));
  const { pT, pG, pS } = params;

  let pLObserved: number;

  if (isCorrect) {
    const numerator = pL * (1 - pS);
    const denominator = numerator + (1 - pL) * pG;
    pLObserved = denominator > 0 ? numerator / denominator : pL;
  } else {
    const numerator = pL * pS;
    const denominator = numerator + (1 - pL) * (1 - pG);
    pLObserved = denominator > 0 ? numerator / denominator : pL;
  }

  // Bilim sakrashi (Transition to learned state)
  const pLNext = pLObserved + (1 - pLObserved) * pT;
  return Math.max(0.01, Math.min(0.99, pLNext));
}

/**
 * Javoblar zanjiri (ketma-ketligi) bo'yicha yakuniy BKT ehtimolligini va rivojlanish trayektoriyasini hisoblash.
 */
export function traceKnowledgeSequence(
  observations: Array<{ isCorrect: boolean; difficulty: QuestionDifficulty; questionType?: string }>,
  initialPL = DEFAULT_BKT_PARAMS.pL0
): { finalProbability: number; trajectory: number[] } {
  let current = initialPL;
  const trajectory: number[] = [current];

  for (const obs of observations) {
    const params = getAdaptiveBktParams(obs.difficulty, obs.questionType);
    current = updateKnowledgeProbability(current, obs.isCorrect, params);
    trajectory.push(Number(current.toFixed(4)));
  }

  return {
    finalProbability: Number(current.toFixed(4)),
    trajectory,
  };
}
