export type MultiSkillAssignment = {
  skill: string;
  creditShare: number; // 0.0 dan 1.0 gacha (xato yoki yutuqning ushbu skillga tegishli ulushi)
  priorMastery: number;
  posteriorMastery: number;
  isPrimarySuspect: boolean; // Xatoning eng ehtimoliy ildiz sababi bo'lgan skill
};

export type MultidimensionalDiagnosis = {
  questionId: string | number;
  isCorrect: boolean;
  involvedSkills: string[];
  assignments: MultiSkillAssignment[];
  primaryRootCauseSkill: string;
  explanation: string;
};

/**
 * Ko'p ko'nikmali savollarda Bayesian Credit & Blame Assignment orqali
 * xato yoki to'g'ri javobni ko'nikmalar orasida adolatli taqsimlash (Q-matrix model).
 */
export function assignMultidimensionalCredit(input: {
  questionId: string | number;
  isCorrect: boolean;
  skills: string[];
  currentSkillMasteries: Map<string, number>; // Har bir skillning joriy o'zlashtirish foizi (0..100)
}): MultidimensionalDiagnosis {
  const skills = input.skills.length ? input.skills : ["general"];

  // Har bir skillning joriy zaiflik darajasi: Deficit = (100 - Mastery)
  const skillDeficits = skills.map((skill) => {
    const current = input.currentSkillMasteries.get(skill) ?? 50;
    return {
      skill,
      mastery: current,
      deficit: Math.max(5, 100 - current),
      proficiency: Math.max(5, current),
    };
  });

  const assignments: MultiSkillAssignment[] = [];

  if (!input.isCorrect) {
    // XATO QILINGANDA: Ayb (Blame) zaifroq bo'lgan skillga ko'proq yuklanadi
    // BlameShare(k) = Deficit(k) / TotalDeficit
    const totalDeficit = skillDeficits.reduce((sum, s) => sum + s.deficit, 0);

    let maxBlame = -1;
    let primarySuspect = skills[0];

    for (const item of skillDeficits) {
      const share = Number((item.deficit / totalDeficit).toFixed(3));
      // Zaif skill ko'proq pasayadi
      const penalty = Math.round(15 * share);
      const posterior = Math.max(5, item.mastery - penalty);

      if (share > maxBlame) {
        maxBlame = share;
        primarySuspect = item.skill;
      }

      assignments.push({
        skill: item.skill,
        creditShare: share,
        priorMastery: item.mastery,
        posteriorMastery: posterior,
        isPrimarySuspect: false,
      });
    }

    // Eng katta ayb yuklangan skillni belgilash
    const suspectItem = assignments.find((a) => a.skill === primarySuspect);
    if (suspectItem) suspectItem.isPrimarySuspect = true;

    return {
      questionId: input.questionId,
      isCorrect: false,
      involvedSkills: skills,
      assignments,
      primaryRootCauseSkill: primarySuspect,
      explanation: `Ko'p ko'nikmali xato tahlili: Xatoning asosiy sababi (ulush: ${(maxBlame * 100).toFixed(0)}%) "${primarySuspect}" ko'nikmasidagi bo'shliq deb aniqlandi.`,
    };
  } else {
    // TO'G'RI YECHILGANDA: O'quvchi uchun eng qiyin/past bo'lgan skillga eng katta o'sish mukofoti beriladi
    const totalDeficit = skillDeficits.reduce((sum, s) => sum + s.deficit, 0);

    for (const item of skillDeficits) {
      const share = Number((item.deficit / totalDeficit).toFixed(3));
      const gain = Math.round(12 * share);
      const posterior = Math.min(100, item.mastery + Math.max(3, gain));

      assignments.push({
        skill: item.skill,
        creditShare: share,
        priorMastery: item.mastery,
        posteriorMastery: posterior,
        isPrimarySuspect: false,
      });
    }

    return {
      questionId: input.questionId,
      isCorrect: true,
      involvedSkills: skills,
      assignments,
      primaryRootCauseSkill: "",
      explanation: "Ko'p ko'nikmali muvaffaqiyat: Barcha ishtirok etgan ko'nikmalar o'zlashtirish darajasiga mos ravishda mustahkamlandi.",
    };
  }
}
