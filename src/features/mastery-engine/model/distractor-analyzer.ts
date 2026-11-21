import type { MistakeType, QuestionDifficulty, TimeQuality } from "./types";

export type ErrorDiagnosisResult = {
  mistakeType: MistakeType;
  misconceptionReason: string;
  remedialTip: string;
  confidenceScore: number; // Diagnostika ishonchliligi (0.0 - 1.0)
};

function normalizeString(val: string): string {
  return String(val ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[$]/g, "")
    .replace(/[()]/g, "");
}

function parseNumeric(val: string): number | null {
  const cleaned = val.replace(/[$ ]/g, "").replace(/,/g, ".");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Algebraik va matnli distractorlarni chuqur tahlil qilish
 */
export function diagnoseMistakePattern(input: {
  studentAnswer: string;
  correctAnswer: string;
  timeSpentSeconds: number;
  estimatedSeconds: number;
  timeQuality: TimeQuality;
  difficulty: QuestionDifficulty;
  questionPrompt?: string;
  options?: string[];
}): ErrorDiagnosisResult {
  const sRaw = input.studentAnswer ?? "";
  const cRaw = input.correctAnswer ?? "";
  const sAns = normalizeString(sRaw);
  const cAns = normalizeString(cRaw);

  // 1. Javobsiz yoki o'tkazib yuborilgan
  if (!sAns) {
    return {
      mistakeType: "concept_gap",
      misconceptionReason: "Savol javobsiz qoldirilgan yoki vaqt yetmay o'tkazib yuborilgan.",
      remedialTip: "Ushbu mavzuning asosiy poydevorini sodda misollardan boshlab qayta ko'rib chiqing.",
      confidenceScore: 0.95,
    };
  }

  const sNum = parseNumeric(sRaw);
  const cNum = parseNumeric(cRaw);
  const promptLower = (input.questionPrompt ?? "").toLowerCase();

  // 2. Ishora xatosi (Sign Error)
  if (sNum !== null && cNum !== null && sNum !== 0 && cNum !== 0) {
    if (sNum === -cNum) {
      return {
        mistakeType: "sign_error",
        misconceptionReason: "Ishoralar qoidasini buzish: Musbat va manfiy sonlarni tenglik orqali o'tkazishda ishora qarama-qarshisiga almashmagan.",
        remedialTip: "Hdlarni tenglikning bir tomonidan ikkinchi tomoniga o'tkazganda: '+' ishora '-' ga, '-' ishora '+' ga aylanadi.",
        confidenceScore: 0.98,
      };
    }

    // 3. O'lchov birligi yoki razryad xatosi (Unit / Order of Magnitude Error)
    if (cNum !== 0) {
      const ratio = Math.abs(sNum / cNum);
      if (Math.abs(ratio - 10) < 0.01 || Math.abs(ratio - 0.1) < 0.01 || Math.abs(ratio - 100) < 0.01 || Math.abs(ratio - 0.01) < 0.01) {
        return {
          mistakeType: "unit_error",
          misconceptionReason: "Razryad yoki o'lchov xatosi: Javob 10 yoki 100 karra farq qilmoqda (vergul yoki nol tushib qolgan).",
          remedialTip: "O'nli kasrlar va foizlar bilan ishlashda vergulning o'ngga/chapga siljishini qayta tekshiring.",
          confidenceScore: 0.92,
        };
      }
    }

    // 4. Hisob-kitob xatosi (Calculation Error)
    const diff = Math.abs(sNum - cNum);
    if (diff > 0 && diff <= 2) {
      return {
        mistakeType: "calculation_error",
        misconceptionReason: "Kichik arifmetik xatolik: Yechish usuli to'g'ri, ammo oxirgi arifmetik amalda (qo'shish/ayirish) 1-2 birlikka adashgansiz.",
        remedialTip: "Hisoblash bosqichlarida shoshilmang, yechimni savol shartiga qo'yib tekshirib ko'ring.",
        confidenceScore: 0.88,
      };
    }
  }

  // 5. Shoshqaloqlik va chala o'qish xatosi (Careless Reading / Rush)
  if (input.timeQuality === "too_fast") {
    return {
      mistakeType: "reading_error",
      misconceptionReason: "Shoshqaloqlik: Savol shartini to'liq o'qimasdan dastlabki ko'ringan variant tanlangan.",
      remedialTip: "Savol aynan nimani so'rayotganini (ildizlar yig'indisi, oraliq, eng katta yoki eng kichik qiymat) belgilab oling.",
      confidenceScore: 0.85,
    };
  }

  // 6. Formulani noto'g'ri qo'llash (Formula Misuse)
  // Masalan, qavs ochish, kvadrat tenglama, diskriminant, ko'paytuvchilarga ajratish
  if (
    promptLower.includes("diskriminant") ||
    promptLower.includes("tengsizlik") ||
    promptLower.includes("ildiz") ||
    promptLower.includes("ko'paytuvchi") ||
    promptLower.includes("qavs") ||
    promptLower.includes("daraja")
  ) {
    return {
      mistakeType: "formula_misuse",
      misconceptionReason: "Formulani noto'g'ri qo'llash: Qisqa ko'paytirish, diskriminant yoki amallar tartibi qoidasini noto'g'ri ishlatgansiz.",
      remedialTip: "Tegishli qoidani (masalan: (a+b)² = a² + 2ab + b², D = b² - 4ac) daftarga yozib, qadam-baqadam yeching.",
      confidenceScore: 0.80,
    };
  }

  // 7. Agar variantlar orasida mashhur tuzoq (distractor) tanlangan bo'lsa
  if (input.options && input.options.length) {
    const isOptionSelected = input.options.some((opt) => normalizeString(opt) === sAns);
    if (isOptionSelected) {
      return {
        mistakeType: "concept_gap",
        misconceptionReason: "Tuzoq variantga tushish: Savol muallifi ataylab noto'g'ri tushunchalar uchun tayyorlagan distractor tanlangan.",
        remedialTip: "Ushbu mavzu bo'yicha tushunchani mustahkamlash uchun mavzuning qisqa video tushuntirishini ko'ring.",
        confidenceScore: 0.78,
      };
    }
  }

  // 8. Fundamental konseptual bo'shliq
  return {
    mistakeType: "concept_gap",
    misconceptionReason: "Konseptual bo'shliq: Savol qo'ygan mantiqiy model va qoidalar to'liq o'zlashtirilmagan.",
    remedialTip: "Mavzuning poydevor darsini qayta ko'rib chiqish va oson misollardan qayta mashq qilish tavsiya etiladi.",
    confidenceScore: 0.75,
  };
}
