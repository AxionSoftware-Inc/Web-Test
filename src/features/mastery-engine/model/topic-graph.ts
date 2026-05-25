import type { TopicNode, TopicMastery } from "./types";

export const algebraTopicGraph: TopicNode[] = [
  {
    slug: "linear-equations",
    title: "Chiziqli tenglamalar",
    subject: "Algebra",
    level: "foundation",
    importance: "high",
    prerequisites: [],
  },
  {
    slug: "fraction-equations",
    title: "Kasrli tenglamalar",
    subject: "Algebra",
    level: "foundation",
    importance: "high",
    prerequisites: ["linear-equations"],
  },
  {
    slug: "sign-handling",
    title: "Ishoralar bilan ishlash",
    subject: "Algebra",
    level: "foundation",
    importance: "high",
    prerequisites: [],
  },
  {
    slug: "factoring",
    title: "Ko'paytuvchilarga ajratish",
    subject: "Algebra",
    level: "core",
    importance: "high",
    prerequisites: ["linear-equations"],
  },
  {
    slug: "inequalities",
    title: "Tengsizliklar",
    subject: "Algebra",
    level: "core",
    importance: "medium",
    prerequisites: ["linear-equations", "sign-handling"],
  },
  {
    slug: "square-roots",
    title: "Ildizlar",
    subject: "Algebra",
    level: "core",
    importance: "medium",
    prerequisites: ["linear-equations"],
  },
  {
    slug: "quadratic-equations",
    title: "Kvadrat tenglamalar",
    subject: "Algebra",
    level: "core",
    importance: "high",
    prerequisites: ["linear-equations", "factoring"],
  },
];

export function createTopicGraph(nodes: TopicNode[] = algebraTopicGraph) {
  const bySlug = new Map(nodes.map((node) => [node.slug, node]));

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
  };
}

export function findWeakPrerequisite(topic: TopicMastery, topics: TopicMastery[], nodes: TopicNode[] = algebraTopicGraph) {
  const graph = createTopicGraph(nodes);
  const prerequisites = [...new Set([...topic.prerequisites, ...graph.prerequisites(topic.topicSlug)])];
  return prerequisites
    .map((slug) => topics.find((item) => item.topicSlug === slug))
    .filter((item): item is TopicMastery => Boolean(item))
    .find((item) => item.status === "weak" || item.status === "needs_practice" || item.mastery < 70);
}
