import type { TopicNode, TopicMastery } from "./types";

export type DynamicGraph = {
  nodes: TopicNode[];
  bySlug: Map<string, TopicNode>;
  get: (slug: string) => TopicNode | undefined;
  isFundamental: (slug: string) => boolean;
  prerequisites: (slug: string) => string[];
  dependents: (slug: string) => TopicNode[];
  topologicalOrder: () => TopicNode[];
  getHubScore: (slug: string) => number; // Mavzuning fanning boshqa mavzulariga ta'sir darajasi (Centrality)
  getAllAncestors: (slug: string) => string[]; // Barcha bevosita va bilvosita ajdodlar
};

/**
 * Algebra fani uchun standart graf
 */
export const algebraTopicGraph: TopicNode[] = [
  { slug: "linear-equations", title: "Chiziqli tenglamalar", subject: "Algebra", level: "foundation", importance: "high", prerequisites: [], order: 1 },
  { slug: "sign-handling", title: "Ishoralar bilan ishlash", subject: "Algebra", level: "foundation", importance: "high", prerequisites: [], order: 2 },
  { slug: "fraction-equations", title: "Kasrli tenglamalar", subject: "Algebra", level: "foundation", importance: "high", prerequisites: ["linear-equations"], order: 3 },
  { slug: "factoring", title: "Ko'paytuvchilarga ajratish", subject: "Algebra", level: "core", importance: "high", prerequisites: ["linear-equations"], order: 4 },
  { slug: "inequalities", title: "Tengsizliklar", subject: "Algebra", level: "core", importance: "medium", prerequisites: ["linear-equations", "sign-handling"], order: 5 },
  { slug: "square-roots", title: "Ildizlar", subject: "Algebra", level: "core", importance: "medium", prerequisites: ["linear-equations"], order: 6 },
  { slug: "quadratic-equations", title: "Kvadrat tenglamalar", subject: "Algebra", level: "core", importance: "high", prerequisites: ["linear-equations", "factoring"], order: 7 },
  { slug: "functions-basics", title: "Funksiyalar va grafiklar", subject: "Algebra", level: "core", importance: "high", prerequisites: ["linear-equations", "quadratic-equations"], order: 8 },
  { slug: "progressions", title: "Progressiyalar", subject: "Algebra", level: "advanced", importance: "medium", prerequisites: ["linear-equations"], order: 9 },
  { slug: "logarithms", title: "Logarifmlar", subject: "Algebra", level: "advanced", importance: "high", prerequisites: ["square-roots", "functions-basics"], order: 10 },
];

/**
 * Fizika fani uchun standart graf
 */
export const physicsTopicGraph: TopicNode[] = [
  { slug: "kinematics-basics", title: "Kinematika asoslari", subject: "Fizika", level: "foundation", importance: "high", prerequisites: [], order: 1 },
  { slug: "newton-laws", title: "Nyuton qonunlari (Dinamika)", subject: "Fizika", level: "foundation", importance: "high", prerequisites: ["kinematics-basics"], order: 2 },
  { slug: "work-and-energy", title: "Ish va energiya saqlanish qonuni", subject: "Fizika", level: "core", importance: "high", prerequisites: ["newton-laws"], order: 3 },
  { slug: "hydrostatics", title: "Gidrostatika (Arximed qonuni)", subject: "Fizika", level: "core", importance: "medium", prerequisites: ["newton-laws"], order: 4 },
  { slug: "thermodynamics", title: "Termodinamika asoslari", subject: "Fizika", level: "core", importance: "high", prerequisites: ["work-and-energy"], order: 5 },
  { slug: "electrodynamics", title: "Elektrodinamika va zanjirlar", subject: "Fizika", level: "advanced", importance: "high", prerequisites: ["work-and-energy"], order: 6 },
];

/**
 * Geometriya fani uchun standart graf
 */
export const geometryTopicGraph: TopicNode[] = [
  { slug: "angles-and-lines", title: "Burchaklar va to'g'ri chiziqlar", subject: "Geometriya", level: "foundation", importance: "high", prerequisites: [], order: 1 },
  { slug: "triangles-basics", title: "Uchburchaklar va tenglik alomatlari", subject: "Geometriya", level: "foundation", importance: "high", prerequisites: ["angles-and-lines"], order: 2 },
  { slug: "pythagorean-theorem", title: "Pifagor teoremasi", subject: "Geometriya", level: "foundation", importance: "high", prerequisites: ["triangles-basics"], order: 3 },
  { slug: "quadrilaterals", title: "To'rtburchaklar va ko'pburchaklar", subject: "Geometriya", level: "core", importance: "medium", prerequisites: ["triangles-basics"], order: 4 },
  { slug: "circles", title: "Aylana va doira", subject: "Geometriya", level: "core", importance: "high", prerequisites: ["triangles-basics"], order: 5 },
  { slug: "similarity", title: "Uchburchaklar o'xshashligi", subject: "Geometriya", level: "advanced", importance: "high", prerequisites: ["triangles-basics", "pythagorean-theorem"], order: 6 },
];

/**
 * Fan nomi bo'yicha grafni olish (yoki tashqi API dan berilgan ixtiyoriy tugunlar bilan ishlash)
 */
export function getSubjectTopicGraph(subject: string, customNodes?: TopicNode[]): TopicNode[] {
  if (customNodes && customNodes.length) return customNodes;
  const normalized = (subject ?? "").toLowerCase();
  if (normalized.includes("fiz") || normalized.includes("phys")) return physicsTopicGraph;
  if (normalized.includes("geom")) return geometryTopicGraph;
  return algebraTopicGraph;
}

/**
 * API dan kelgan mavzular ro'yxatini to'laqonli TopicNode[] DAG grafigiga aylantirish
 */
export function buildDynamicGraphFromApiTopics(
  topics: Array<{ slug: string; title: string; subject_slug?: string; description?: string }>,
  subjectName = "General"
): TopicNode[] {
  return topics.map((t, index) => {
    // Agar aniq prerequisite berilmagan bo'lsa, poydevor qatorini tekislash
    const isFirstTwo = index < 2;
    return {
      slug: t.slug,
      title: t.title,
      subject: subjectName,
      level: isFirstTwo ? "foundation" : index < topics.length - 2 ? "core" : "advanced",
      importance: isFirstTwo ? "high" : "medium",
      prerequisites: index > 0 && !isFirstTwo ? [topics[Math.max(0, index - 1)].slug] : [],
      order: index + 1,
    };
  });
}

/**
 * Kahn Algoritmi yordamida Topologik tartiblash (Topological Sort)
 * Grafda siklik bog'liqliklar bo'lsa xavfsiz tartiblaydi.
 */
function kahnTopologicalSort(nodes: TopicNode[]): TopicNode[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  const bySlug = new Map(nodes.map((n) => [n.slug, n]));

  nodes.forEach((n) => {
    inDegree.set(n.slug, 0);
    adjList.set(n.slug, []);
  });

  nodes.forEach((n) => {
    n.prerequisites.forEach((pSlug) => {
      if (adjList.has(pSlug)) {
        adjList.get(pSlug)!.push(n.slug);
        inDegree.set(n.slug, (inDegree.get(n.slug) ?? 0) + 1);
      }
    });
  });

  const queue: string[] = [];
  inDegree.forEach((deg, slug) => {
    if (deg === 0) queue.push(slug);
  });

  const sorted: TopicNode[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const node = bySlug.get(curr);
    if (node) sorted.push(node);

    const neighbors = adjList.get(curr) ?? [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Agar qaysidir tugun sikl sabab qolib ketgan bo'lsa, ularni oxiriga qo'shish
  if (sorted.length < nodes.length) {
    const included = new Set(sorted.map((n) => n.slug));
    for (const node of nodes) {
      if (!included.has(node.slug)) sorted.push(node);
    }
  }

  return sorted;
}

/**
 * Dinamik graf obyekti yaratish
 */
export function createTopicGraph(nodes: TopicNode[] = algebraTopicGraph): DynamicGraph {
  const bySlug = new Map(nodes.map((node) => [node.slug, node]));

  // Barcha bevosita va bilvosita ajdodlarni qidirish (DFS)
  function getAllAncestors(slug: string, visited = new Set<string>()): string[] {
    const node = bySlug.get(slug);
    if (!node) return [];

    for (const p of node.prerequisites) {
      if (!visited.has(p)) {
        visited.add(p);
        getAllAncestors(p, visited);
      }
    }
    return Array.from(visited);
  }

  return {
    nodes,
    bySlug,
    get(slug: string) {
      return bySlug.get(slug);
    },
    isFundamental(slug: string) {
      const node = bySlug.get(slug);
      return node?.level === "foundation" || node?.importance === "high";
    },
    prerequisites(slug: string) {
      return bySlug.get(slug)?.prerequisites ?? [];
    },
    dependents(slug: string) {
      return nodes.filter((node) => node.prerequisites.includes(slug));
    },
    topologicalOrder() {
      return kahnTopologicalSort(nodes);
    },
    getHubScore(slug: string) {
      // Out-degree: ushbu mavzu nechta boshqa mavzuning o'rganilishiga ta'sir qiladi
      const directDependents = nodes.filter((n) => n.prerequisites.includes(slug)).length;
      return directDependents * 15 + (this.isFundamental(slug) ? 25 : 0);
    },
    getAllAncestors,
  };
}

/**
 * Zaif poydevorning ildiz sababini aniqlash (Root Cause Prerequisite)
 */
export function findWeakPrerequisite(
  topic: TopicMastery,
  topics: TopicMastery[],
  nodes: TopicNode[] = algebraTopicGraph
): TopicMastery | undefined {
  const graph = createTopicGraph(nodes);
  const allAncestors = graph.getAllAncestors(topic.topicSlug);

  // Barcha ajdodlarni tekshiramiz: eng chuqur/avvalgi zaif bo'g'inni topish
  const weakAncestors = allAncestors
    .map((slug) => topics.find((item) => item.topicSlug === slug))
    .filter((item): item is TopicMastery => Boolean(item))
    .filter((item) => item.status === "weak" || item.status === "needs_practice" || item.mastery < 70);

  // Agar bir nechta zaif ajdod bo'lsa, eng past masteryga ega bo'lganini qaytarish
  if (weakAncestors.length > 0) {
    return weakAncestors.sort((a, b) => a.mastery - b.mastery)[0];
  }

  return undefined;
}
