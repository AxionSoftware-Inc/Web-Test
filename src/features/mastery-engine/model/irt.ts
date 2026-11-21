import type { ConfidenceLevel, QuestionDifficulty } from "./types";

export type IRTItemParameters = {
  a: number; // Discrimination (ajratish qobiliyati: 0.5 - 2.5)
  b: number; // Difficulty (qiyinlik darajasi: -2.5 dan +2.5 gacha)
  c: number; // Pseudo-guessing (taxminan topish: 0.0 - 0.25)
};

export type IRTStudentEstimate = {
  theta: number;              // Yashirin qobiliyat darajasi (-3.0 dan +3.0 gacha)
  standardError: number;      // O'lchov standart xatoligi SE(theta)
  fisherInformation: number;  // Testning jami Fisher axborot miqdori
  masteryPercent: number;     // 0 dan 100% gacha konvertatsiya qilingan o'zlashtirish
  confidence: ConfidenceLevel;// Matematik SE asosidagi ishonchlilik darajasi
};

/**
 * Savol qiyinligi va turiga qarab standart IRT parametrlarini generatsiya qilish
 */
export function getIRTItemParameters(difficulty: QuestionDifficulty, questionType?: string): IRTItemParameters {
  let b = 0.0;
  if (difficulty === "easy") b = -1.2;
  else if (difficulty === "medium") b = 0.1;
  else if (difficulty === "hard") b = 1.6;

  let a = 1.4; // Standart yaxshi diskriminatsiya
  if (difficulty === "hard") a = 1.8;

  let c = 0.25; // 4 variantli test
  if (questionType === "short_answer") c = 0.01;
  else if (questionType === "multiple_choice") c = 0.08;

  return { a, b, c };
}

/**
 * 3PL (Three-Parameter Logistic) model bo'yicha to'g'ri javob berish ehtimolligi
 * P(theta) = c + (1 - c) / (1 + exp(-1.7 * a * (theta - b)))
 */
export function irtProbability(theta: number, item: IRTItemParameters): number {
  const exponent = -1.7 * item.a * (theta - item.b);
  const clampedExp = Math.max(-30, Math.min(30, exponent));
  const logistic = 1 / (1 + Math.exp(clampedExp));
  return item.c + (1 - item.c) * logistic;
}

/**
 * Fisher Information Function (Savol beradigan axborot miqdori)
 * I_j(theta) = (P'_j(theta))^2 / (P_j(theta) * (1 - P_j(theta)))
 */
export function irtItemInformation(theta: number, item: IRTItemParameters): number {
  const p = irtProbability(theta, item);
  const q = 1 - p;
  if (p <= item.c || p >= 1.0) return 0.001;

  const numerator = Math.pow(1.7 * item.a, 2) * q * Math.pow(p - item.c, 2);
  const denominator = Math.pow(1 - item.c, 2) * p;

  return denominator > 0 ? Math.max(0.0001, numerator / denominator) : 0.0001;
}

/**
 * Expected A Posteriori (EAP) Bayes integrali orqali latent qobiliyatni (theta) va SE ni baholash.
 * Standart normal taqsimot N(0, 1) prior bilan Gauss-Hermite kvadraturalari yordamida hisoblanadi.
 */
export function estimateAbilityEAP(
  responses: Array<{ isCorrect: boolean; difficulty: QuestionDifficulty; questionType?: string }>,
  priorMean = 0.0,
  priorSd = 1.0
): IRTStudentEstimate {
  if (!responses.length) {
    return {
      theta: 0.0,
      standardError: 1.0,
      fisherInformation: 1.0,
      masteryPercent: 50,
      confidence: "low",
    };
  }

  // 41 ta Gauss-Hermite kvadraturasi nuqtalari [-3.5 dan +3.5 gacha]
  const quadraturePoints: number[] = [];
  const weights: number[] = [];
  const numPoints = 41;
  const minX = -3.5;
  const maxX = 3.5;
  const step = (maxX - minX) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = minX + i * step;
    quadraturePoints.push(x);
    // Standart normal taqsimot zichligi: phi(x)
    const norm = (1 / (priorSd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - priorMean) / priorSd, 2));
    weights.push(norm * step);
  }

  // Har bir kvadraturada Likelihood (ehtimolliklar ko'paytmasi) hisoblanadi
  const items = responses.map((r) => getIRTItemParameters(r.difficulty, r.questionType));

  const likelihoods: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const theta = quadraturePoints[i];
    let logLikelihood = 0;
    for (let j = 0; j < responses.length; j++) {
      const p = irtProbability(theta, items[j]);
      const isCorrect = responses[j].isCorrect;
      logLikelihood += Math.log(Math.max(1e-9, isCorrect ? p : 1 - p));
    }
    likelihoods.push(Math.exp(logLikelihood));
  }

  // A posteriori kutilgan qiymat: EAP(theta) = integral(theta * L * W) / integral(L * W)
  let denom = 0;
  let numerTheta = 0;
  for (let i = 0; i < numPoints; i++) {
    const lw = likelihoods[i] * weights[i];
    denom += lw;
    numerTheta += quadraturePoints[i] * lw;
  }

  const thetaHat = denom > 0 ? numerTheta / denom : 0.0;

  // Fisher axborot funksiyasi yig'indisi
  let fisherInformation = 0;
  for (let j = 0; j < items.length; j++) {
    fisherInformation += irtItemInformation(thetaHat, items[j]);
  }

  // Standart xatolik: posterior dispersion va Fisher Information uyg'unligi
  let numerVar = 0;
  for (let i = 0; i < numPoints; i++) {
    const lw = likelihoods[i] * weights[i];
    numerVar += Math.pow(quadraturePoints[i] - thetaHat, 2) * lw;
  }
  const quadratureVariance = denom > 0 ? Math.max(0.01, numerVar / denom) : 1.0;
  const infoVariance = 1 / Math.max(1.0, fisherInformation + 1 / Math.pow(priorSd, 2));
  const standardError = Math.min(Math.sqrt(quadratureVariance), Math.sqrt(infoVariance));

  // Theta [-3.0 .. +3.0] ni [0 .. 100%] ga logistik o'tkazish
  const masteryPercent = Math.round(100 / (1 + Math.exp(-1.4 * thetaHat)));

  // Ishonchlilik aniqligi: Fisher Information va SE ga asosan
  let confidence: ConfidenceLevel = "low";
  if (standardError <= 0.45 && fisherInformation >= 4.0) {
    confidence = "high";
  } else if (standardError <= 0.75 && fisherInformation >= 1.8) {
    confidence = "medium";
  }

  return {
    theta: Number(thetaHat.toFixed(3)),
    standardError: Number(standardError.toFixed(3)),
    fisherInformation: Number(fisherInformation.toFixed(3)),
    masteryPercent,
    confidence,
  };
}
