import { latexTestBank } from "@/features/test-generator/model/latex-test-bank";

export const mathematicsTests = latexTestBank.filter((test) => test.subject === "mathematics");

export const mathematicsLevels = [
  {
    difficulty: "beginner",
    title: "Beginner",
    copy: "Algebra asoslari, oddiy formula ishlatish va tez tekshiruv savollari.",
  },
  {
    difficulty: "intermediate",
    title: "Intermediate",
    copy: "Calculus, funksiyalar va ko'p bosqichli masalalar.",
  },
  {
    difficulty: "advanced",
    title: "Advanced",
    copy: "Number theory, isbotga yaqin reasoning va murakkabroq challenge.",
  },
] as const;

export const mathematicsSkills = [
  "Algebra",
  "Calculus",
  "Number Theory",
  "Functions",
  "Proof reasoning",
  "Problem solving speed",
];
