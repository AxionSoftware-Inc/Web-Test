import type { LearningPathNode, LearningPathSummary, TopicMastery, TopicNode } from "./types";
import { createTopicGraph, algebraTopicGraph } from "./topic-graph";

/**
 * O'quvchining fan xaritasidagi joriy o'rni, bosib o'tgan masofasi va keyingi chegarasini (Knowledge Frontier) hisoblash.
 */
export function buildLearningPathSummary(input: {
  subject: string;
  topicMasteries: TopicMastery[];
  topicGraphNodes?: TopicNode[];
}): LearningPathSummary {
  const nodes = input.topicGraphNodes ?? algebraTopicGraph;
  const graph = createTopicGraph(nodes);
  const masteryMap = new Map<string, TopicMastery>(input.topicMasteries.map((m) => [m.topicSlug, m]));

  const pathNodes: LearningPathNode[] = [];
  let completedCount = 0;

  // Mavzularni poydevor va tartib bo'yicha saralash
  const sortedNodes = [...nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  for (let index = 0; index < sortedNodes.length; index++) {
    const node = sortedNodes[index];
    const mastery = masteryMap.get(node.slug);
    const score = mastery?.mastery ?? 0;
    const depth = mastery?.depthAnalysis?.depthStatus ?? "fragile";
    const status = mastery?.status ?? "not_started";

    // Mavzu to'liq o'zlashtirilgan hisoblanadi, agar mastery >= 75 va sayoz bo'lmasa
    const isCompleted = score >= 75 && depth !== "shallow" && status === "mastered";
    if (isCompleted) {
      completedCount += 1;
    }

    // Prerequisite'lar tekshiruvi: ushbu mavzuni o'rganishga ruxsat bormi yoki bloklanganmi?
    const prereqSlugs = graph.prerequisites(node.slug);
    const blockingPrerequisites: string[] = [];

    for (const prereqSlug of prereqSlugs) {
      const pMastery = masteryMap.get(prereqSlug);
      const isPrereqDone = (pMastery?.mastery ?? 0) >= 70;
      if (!isPrereqDone) {
        const pNode = graph.get(prereqSlug);
        blockingPrerequisites.push(pNode?.title ?? prereqSlug);
      }
    }

    const isBlocked = blockingPrerequisites.length > 0;
    // Hozirgi chegara (Frontier): hali bitmagan, ammo barcha prerequisite'lari tayyor bo'lgan birinchi mavzular
    const isCurrentFrontier = !isCompleted && !isBlocked;

    let whyNext = "";
    if (isBlocked) {
      whyNext = `Oldin ${blockingPrerequisites.join(", ")} mavzulari o'zlashtirilishi shart.`;
    } else if (isCurrentFrontier) {
      if (score === 0) {
        whyNext = "Yangi bekat: barcha poydevor bilimlaringiz yetarli, ushbu mavzuni o'rganishni boshlashingiz mumkin.";
      } else if (depth === "shallow") {
        whyNext = "Sayozlikni to'g'irlash: qoidalarni bilasiz, ammo amaliy va tahliliy misollarni mustahkamlashingiz zarur.";
      } else {
        whyNext = `Hozirgi bekat: o'zlashtirish ${score}%. 75% chegarasiga yetkazish uchun qo'shimcha mashq qiling.`;
      }
    } else if (isCompleted) {
      whyNext = "Muvaffaqiyatli yakunlangan. Bilimni unutmaslik uchun vaqti-vaqti bilan takrorlab turing.";
    }

    pathNodes.push({
      topicSlug: node.slug,
      title: node.title,
      subject: node.subject,
      level: node.level,
      status,
      depthStatus: depth,
      mastery: score,
      order: node.order ?? index + 1,
      isCompleted,
      isCurrentFrontier,
      isBlocked,
      blockingPrerequisites,
      whyNext,
    });
  }

  const frontierNodes = pathNodes.filter((n) => n.isCurrentFrontier);
  const nextRecommendedNode = frontierNodes[0] ?? pathNodes.find((n) => !n.isCompleted);
  const totalNodes = Math.max(1, pathNodes.length);
  const pathProgressPercent = Math.round((completedCount / totalNodes) * 100);

  return {
    subject: input.subject,
    totalNodes: pathNodes.length,
    completedNodesCount: completedCount,
    pathProgressPercent,
    currentFrontier: frontierNodes,
    nextRecommendedNode,
    nodes: pathNodes,
  };
}
