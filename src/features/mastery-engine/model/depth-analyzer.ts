import type { CognitiveLevel, DepthAnalysis, DepthStatus, QuestionDifficulty } from "./types";

export type AdvancedDepthAnalysis = DepthAnalysis & {
  templateDiversityIndex: number;  // Savollar xilma-xilligi (0.0 bir xil shablon - 1.0 yuqori rang-baranglik)
  cognitiveGradient: number;       // Darajalar bo'yicha pasayish gradienti (dAccuracy / dLevel)
  transferIndex: number;           // Far Transfer qobiliyati (-1.0 dan +1.0 gacha)
  isRoteMemorized: boolean;        // Bir xil shablonni yodlab olganlik belgisi
};

/**
 * Matnlar o'rtasidagi Jaccard so'zlar o'xshashligini hisoblash
 */
function calculateJaccardSimilarity(textA: string, textB: string): number {
  const tokenize = (str: string) =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (!setA.size || !setB.size) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Savollar to'plamining shablon o'xshashligi va rang-baranglik (diversity) darajasini hisoblash
 */
export function calculateItemDiversity(prompts: string[]): number {
  if (prompts.length <= 1) return 1.0;

  let totalSim = 0;
  let pairs = 0;

  for (let i = 0; i < prompts.length; i++) {
    for (let j = i + 1; j < prompts.length; j++) {
      totalSim += calculateJaccardSimilarity(prompts[i], prompts[j]);
      pairs++;
    }
  }

  const avgSimilarity = pairs > 0 ? totalSim / pairs : 0;
  // Diversity = 1 - O'rtacha o'xshashlik
  return Math.max(0.1, Number((1 - avgSimilarity).toFixed(2)));
}

/**
 * Savolning kognitiv darajasini matn, kalit so'zlar va qiyinlik orqali aniq infer qilish
 */
export function inferCognitiveLevel(input: {
  prompt?: string;
  difficulty: QuestionDifficulty;
  skills?: string[];
  cognitiveLevel?: CognitiveLevel;
}): CognitiveLevel {
  if (input.cognitiveLevel) return input.cognitiveLevel;

  const text = (input.prompt ?? "").toLowerCase();

  // 4. Analytical: Hayotiy kontekst, tahlil, sintez, optimallashtirish
  if (
    text.includes("qaysi holda") ||
    text.includes("sababi nima") ||
    text.includes("amaliy") ||
    text.includes("mos kelmaydi") ||
    text.includes("farq qiladi") ||
    text.includes("eng katta") ||
    text.includes("eng kichik") ||
    text.includes("bog'liqlik") ||
    input.difficulty === "hard"
  ) {
    return "analytical";
  }

  // 3. Conceptual: Ma'no, tushunish, grafik, izohlash
  if (
    text.includes("nimani ifodalaydi") ||
    text.includes("grafik") ||
    text.includes("ma'nosi") ||
    text.includes("xossasi") ||
    text.includes("munosabat")
  ) {
    return "conceptual";
  }

  // 1. Recall: Qoida, ta'rif, formula eslash
  if (
    text.includes("ta'rif") ||
    text.includes("qoida") ||
    text.includes("formula") ||
    text.includes("qanday ataladi")
  ) {
    return "recall";
  }

  // 2. Procedural: Standart hisoblash va tenglamalar
  return "procedural";
}

/**
 * Ilg'or Kognitiv Chuqurlik, Bloom Gradienti va Transfer Index tahlilchisi
 */
export function analyzeCognitiveDepth(
  answers: Array<{
    isCorrect: boolean;
    difficulty: QuestionDifficulty;
    cognitiveLevel?: CognitiveLevel;
    prompt?: string;
  }>
): AdvancedDepthAnalysis {
  if (!answers.length) {
    return {
      recallAccuracy: 0,
      proceduralAccuracy: 0,
      analyticalAccuracy: 0,
      depthScore: 0,
      depthStatus: "fragile",
      depthSummary: "Mavzu bo'yicha kognitiv chuqurlikni baholash uchun yetarli ma'lumot yo'q.",
      templateDiversityIndex: 1.0,
      cognitiveGradient: 0,
      transferIndex: 0,
      isRoteMemorized: false,
    };
  }

  const buckets: Record<"recall" | "procedural" | "conceptual" | "analytical", { correct: number; total: number }> = {
    recall: { correct: 0, total: 0 },
    procedural: { correct: 0, total: 0 },
    conceptual: { correct: 0, total: 0 },
    analytical: { correct: 0, total: 0 },
  };

  const prompts: string[] = [];

  answers.forEach((ans) => {
    const level = inferCognitiveLevel({
      prompt: ans.prompt,
      difficulty: ans.difficulty,
      cognitiveLevel: ans.cognitiveLevel,
    });
    buckets[level].total += 1;
    if (ans.isCorrect) buckets[level].correct += 1;
    if (ans.prompt) prompts.push(ans.prompt);
  });

  const recallAcc = buckets.recall.total > 0 ? Math.round((buckets.recall.correct / buckets.recall.total) * 100) : 0;
  const procAcc = buckets.procedural.total > 0 ? Math.round((buckets.procedural.correct / buckets.procedural.total) * 100) : 0;
  const concAcc = buckets.conceptual.total > 0 ? Math.round((buckets.conceptual.correct / buckets.conceptual.total) * 100) : 0;
  const analAcc = buckets.analytical.total > 0 ? Math.round((buckets.analytical.correct / buckets.analytical.total) * 100) : 0;

  // 1. Savollar xilma-xilligi (Diversity)
  const templateDiversityIndex = calculateItemDiversity(prompts);

  // 2. Far Transfer Index: Nostandart (analytical/conceptual) va Standart (procedural/recall) farqi
  const standardAcc = (recallAcc * buckets.recall.total + procAcc * buckets.procedural.total) / Math.max(1, buckets.recall.total + buckets.procedural.total);
  const transferAcc = (concAcc * buckets.conceptual.total + analAcc * buckets.analytical.total) / Math.max(1, buckets.conceptual.total + buckets.analytical.total);
  const transferIndex = Number(((transferAcc - standardAcc) / 100).toFixed(2));

  // 3. Kognitiv gradient (Daraja oshgani sari aniqlik qanday o'zgaradi)
  // X = [1, 2, 3, 4], Y = [recall, procedural, conceptual, analytical]
  const levels = [
    { x: 1, y: recallAcc, count: buckets.recall.total },
    { x: 2, y: procAcc, count: buckets.procedural.total },
    { x: 3, y: concAcc, count: buckets.conceptual.total },
    { x: 4, y: analAcc, count: buckets.analytical.total },
  ].filter((item) => item.count > 0);

  let cognitiveGradient = 0;
  if (levels.length >= 2) {
    const meanX = levels.reduce((s, l) => s + l.x, 0) / levels.length;
    const meanY = levels.reduce((s, l) => s + l.y, 0) / levels.length;
    let covXY = 0;
    let varX = 0;
    for (const l of levels) {
      covXY += (l.x - meanX) * (l.y - meanY);
      varX += Math.pow(l.x - meanX, 2);
    }
    cognitiveGradient = varX > 0 ? Number((covXY / varX / 100).toFixed(2)) : 0;
  }

  // 4. Shablon yodlab olganlik (Rote Memorization) detektori:
  // Agar savollar o'xshash bo'lsa (diversity < 0.35) yoki standart savollar yuqori bo'lib, transfer keskin past bo'lsa
  const isRoteMemorized = (standardAcc >= 75 && transferAcc < 40 && transferIndex <= -0.35) || (templateDiversityIndex < 0.30 && standardAcc >= 80);

  // 5. Chuqurlik indeksi (Depth Score)
  let rawDepthScore = 0;
  if (buckets.analytical.total > 0 && buckets.procedural.total > 0) {
    rawDepthScore = analAcc * 0.45 + concAcc * 0.25 + procAcc * 0.20 + recallAcc * 0.10;
  } else if (buckets.analytical.total > 0) {
    rawDepthScore = analAcc * 0.60 + procAcc * 0.40;
  } else {
    rawDepthScore = Math.min(65, procAcc * 0.65 + recallAcc * 0.35);
  }

  // Agar shablon yodlangan bo'lsa, chuqurlik penaltisi
  if (isRoteMemorized) {
    rawDepthScore *= 0.65;
  }

  const depthScore = Math.round(Math.max(0, Math.min(100, rawDepthScore)));

  // 6. Kognitiv Status va Diagnostik Xulosa
  let depthStatus: DepthStatus = "fragile";
  let depthSummary = "";

  if (isRoteMemorized) {
    depthStatus = "shallow";
    depthSummary = "Sayoz / Yodlab olingan: Standart misollarni yodlagan, ammo yangi yoki nostandart vaziyatlarda qo'llay olmaydi.";
  } else if (depthScore >= 75 && analAcc >= 70 && transferIndex >= -0.15) {
    depthStatus = "deep";
    depthSummary = "Chuqur va moslashuvchan: Murakkab, tahliliy va amaliy masalalarni erkin yechadi.";
  } else if (procAcc >= 70 && analAcc < 50) {
    depthStatus = "procedural";
    depthSummary = "Qolip bo'yicha o'rganilgan: Standart algoritmlarni biladi, ammo tahlil talab qilinadigan shartlarda qiynaladi.";
  } else if (depthScore < 45) {
    depthStatus = "shallow";
    depthSummary = "Sayoz o'zlashtirish: Mavzu tushunchalari poydevor darajasida mustahkam emas.";
  } else {
    depthStatus = "fragile";
    depthSummary = "O'zgaruvchan bilim: Ba'zi savollarni to'g'ri topmoqda, ammo barqaror chuqurlik shakllanmagan.";
  }

  return {
    recallAccuracy: recallAcc,
    proceduralAccuracy: procAcc,
    analyticalAccuracy: analAcc,
    depthScore,
    depthStatus,
    depthSummary,
    templateDiversityIndex,
    cognitiveGradient,
    transferIndex,
    isRoteMemorized,
  };
}
