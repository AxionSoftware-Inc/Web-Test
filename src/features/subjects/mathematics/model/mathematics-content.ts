import { latexTestBank } from "@/features/test-generator/model/latex-test-bank";

export const mathematicsTests = latexTestBank.filter((test) => test.subject === "mathematics");

export const mathematicsTopics = [
  {
    slug: "arithmetic",
    title: "Arithmetic",
    copy: "Sonlar, kasrlar, foizlar, nisbatlar va tez hisoblash asoslari.",
    skills: ["Number sense", "Fractions", "Percentages", "Ratios"],
    levels: ["beginner", "intermediate"],
  },
  {
    slug: "algebra",
    title: "Algebra",
    copy: "Tenglama, ifoda, funksiya va formulalar bilan ishlash.",
    skills: ["Equations", "Functions", "Quadratics", "Expressions"],
    levels: ["beginner", "intermediate", "advanced"],
  },
  {
    slug: "geometry",
    title: "Geometry",
    copy: "Shakllar, burchaklar, uchburchaklar, koordinata geometriyasi va isbotlar.",
    skills: ["Angles", "Triangles", "Circles", "Coordinate geometry"],
    levels: ["beginner", "intermediate", "advanced"],
  },
  {
    slug: "trigonometry",
    title: "Trigonometry",
    copy: "Sinus, kosinus, trigonometrik identitylar va uchburchak masalalari.",
    skills: ["Unit circle", "Identities", "Graphs", "Triangle solving"],
    levels: ["intermediate", "advanced"],
  },
  {
    slug: "calculus",
    title: "Calculus",
    copy: "Limit, derivative, integral va o'zgarishni tahlil qilish.",
    skills: ["Limits", "Derivatives", "Integrals", "Applications"],
    levels: ["intermediate", "advanced"],
  },
  {
    slug: "linear-algebra",
    title: "Linear Algebra",
    copy: "Vector, matrix, linear transformation va eigenvalue asoslari.",
    skills: ["Vectors", "Matrices", "Transformations", "Eigenvalues"],
    levels: ["beginner", "intermediate", "advanced"],
  },
  {
    slug: "probability",
    title: "Probability",
    copy: "Hodisalar, ehtimollik qoidalari, random variable va expected value.",
    skills: ["Events", "Counting", "Conditional probability", "Expected value"],
    levels: ["beginner", "intermediate", "advanced"],
  },
  {
    slug: "statistics",
    title: "Statistics",
    copy: "Data, distribution, average, variance va inference asoslari.",
    skills: ["Data", "Distributions", "Variance", "Inference"],
    levels: ["beginner", "intermediate"],
  },
  {
    slug: "differential-equations",
    title: "Differential Equations",
    copy: "O'zgarish tezligi, model qurish va oddiy differensial tenglamalar.",
    skills: ["ODE basics", "Separation", "Modeling", "Stability"],
    levels: ["advanced"],
  },
  {
    slug: "discrete-math",
    title: "Discrete Math",
    copy: "Logic, combinatorics, graph, recurrence va proof thinking.",
    skills: ["Logic", "Combinatorics", "Graphs", "Recurrences"],
    levels: ["intermediate", "advanced"],
  },
] as const;

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
  "Arithmetic",
  "Algebra",
  "Geometry",
  "Trigonometry",
  "Calculus",
  "Linear Algebra",
  "Probability",
  "Statistics",
  "Differential Equations",
  "Discrete Math",
  "Number Theory",
  "Functions",
  "Proof reasoning",
  "Problem solving speed",
];

export function getMathematicsTestsByTopic(topicTitle: string) {
  return mathematicsTests.filter((test) => test.category.toLowerCase() === topicTitle.toLowerCase());
}
