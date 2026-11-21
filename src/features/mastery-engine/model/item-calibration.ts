import type { QuestionDifficulty } from "./types";

export type ItemResponseRecord = {
  questionId: string | number;
  isCorrect: boolean;
  studentOverallScore: number; // O'quvchining ushbu testdagi jami balli (0..100)
};

export type CalibratedItemResult = {
  questionId: string | number;
  totalAttempts: number;
  pValue: number;                      // Osonlik koeffitsiyenti (0.0 juda qiyin - 1.0 juda oson)
  pointBiserial: number;              // Diskriminatsiya korrelyatsiyasi (-1.0 dan +1.0 gacha)
  authorDifficulty: QuestionDifficulty;
  calibratedDifficulty: QuestionDifficulty;
  calibratedIrtB: number;             // Yangilangan empirik IRT qiyinlik parametri (-2.5 .. +2.5)
  calibratedIrtA: number;             // Yangilangan empirik IRT diskriminatsiya parametri (0.5 .. 2.5)
  itemHealth: "healthy" | "needs_review" | "flawed_question";
  recommendation: string;
};

/**
 * Savollar bankidagi har bir savolning haqiqiy empirik qiyinligi va diskriminatsiyasini
 * Marginal Maximum Likelihood & Classical Test Theory tamoyillari asosida kalibrlash.
 */
export function calibrateItemStatistics(
  questionId: string | number,
  authorDifficulty: QuestionDifficulty,
  records: ItemResponseRecord[]
): CalibratedItemResult {
  const itemRecords = records.filter((r) => String(r.questionId) === String(questionId));

  // Agar javoblar soni kam bo'lsa (kamida 5 ta javob kerak)
  if (itemRecords.length < 5) {
    let defaultB = authorDifficulty === "easy" ? -1.2 : authorDifficulty === "hard" ? 1.5 : 0.0;
    return {
      questionId,
      totalAttempts: itemRecords.length,
      pValue: authorDifficulty === "easy" ? 0.8 : authorDifficulty === "hard" ? 0.3 : 0.6,
      pointBiserial: 0.35,
      authorDifficulty,
      calibratedDifficulty: authorDifficulty,
      calibratedIrtB: defaultB,
      calibratedIrtA: 1.4,
      itemHealth: "healthy",
      recommendation: "Savol bo'yicha javoblar soni kam. Hozircha muallif qiyinligi qoldirildi.",
    };
  }

  const N = itemRecords.length;
  const correctCount = itemRecords.filter((r) => r.isCorrect).length;
  const pValue = Number((correctCount / N).toFixed(3));

  // Point-Biserial korrelyatsiyasini hisoblash
  // r_pbis = (MeanCorrect - MeanWrong) / StdDev * sqrt(p * q)
  const correctScores = itemRecords.filter((r) => r.isCorrect).map((r) => r.studentOverallScore);
  const wrongScores = itemRecords.filter((r) => !r.isCorrect).map((r) => r.studentOverallScore);

  const meanTotal = itemRecords.reduce((s, r) => s + r.studentOverallScore, 0) / N;
  const varianceTotal = itemRecords.reduce((s, r) => s + Math.pow(r.studentOverallScore - meanTotal, 2), 0) / N;
  const stdDevTotal = Math.sqrt(Math.max(1e-4, varianceTotal));

  let rPbis = 0.30;
  if (correctScores.length > 0 && wrongScores.length > 0) {
    const meanCorrect = correctScores.reduce((s, v) => s + v, 0) / correctScores.length;
    const meanWrong = wrongScores.reduce((s, v) => s + v, 0) / wrongScores.length;
    const p = pValue;
    const q = 1 - p;
    rPbis = Number((((meanCorrect - meanWrong) / stdDevTotal) * Math.sqrt(p * q)).toFixed(3));
  }

  // Empirik IRT parametrlarini hisoblash (Normit/Logit transformatsiyasi)
  // b ≈ -ln(p / (1 - p)) / 1.7
  const safeP = Math.max(0.02, Math.min(0.98, pValue));
  const calibratedIrtB = Number((-Math.log(safeP / (1 - safeP)) / 1.7).toFixed(2));
  const calibratedIrtA = Number(Math.max(0.6, Math.min(2.4, 1.0 + rPbis * 1.5)).toFixed(2));

  // Haqiqiy kalibrlangan qiyinlik
  let calibratedDifficulty: QuestionDifficulty = "medium";
  if (pValue >= 0.75) calibratedDifficulty = "easy";
  else if (pValue <= 0.40) calibratedDifficulty = "hard";

  // Savol sifati diagnostikasi (Item Health)
  let itemHealth: "healthy" | "needs_review" | "flawed_question" = "healthy";
  let recommendation = "Savol me'yorida ishlamoqda.";

  if (rPbis < 0) {
    itemHealth = "flawed_question";
    recommendation = "Xavfli savol: Kuchli o'quvchilar ko'proq adashgan. Savol shartida chalkashlik yoki to'g'ri javob kalitida xato bo'lishi mumkin!";
  } else if (rPbis < 0.15) {
    itemHealth = "needs_review";
    recommendation = "Past diskriminatsiya: Savol biladigan va bilmaydigan o'quvchilarni yaxshi ajrata olmayapti.";
  } else if (calibratedDifficulty !== authorDifficulty) {
    recommendation = `Qiyinlik nomutanosibligi: Muallif "${authorDifficulty}" deb belgilagan, ammo o'quvchilar statistikasi "${calibratedDifficulty}" ekanligini ko'rsatmoqda.`;
  }

  return {
    questionId,
    totalAttempts: N,
    pValue,
    pointBiserial: rPbis,
    authorDifficulty,
    calibratedDifficulty,
    calibratedIrtB,
    calibratedIrtA,
    itemHealth,
    recommendation,
  };
}
