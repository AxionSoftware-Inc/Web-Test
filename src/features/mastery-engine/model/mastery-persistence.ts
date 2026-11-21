import type { MasteryReport } from "./types";

const STORAGE_KEY_PREFIX = "questlab:persistent-mastery:";

export type StudentMasterySyncPayload = {
  studentId: string;
  syncedAt: string;
  version: number;
  report: MasteryReport;
};

/**
 * Talabaning to'liq diagnostik hisobotini mahalliy xotirada saqlash
 */
export function persistLocalMasteryReport(report: MasteryReport): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StudentMasterySyncPayload = {
      studentId: report.studentId,
      syncedAt: new Date().toISOString(),
      version: 1,
      report,
    };
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${report.studentId}`, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or disabled errors
  }
}

/**
 * Talabaning saqlangan diagnostik hisobotini o'qish
 */
export function loadLocalMasteryReport(studentId: string): MasteryReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${studentId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentMasterySyncPayload;
    return parsed?.report ?? null;
  } catch {
    return null;
  }
}

/**
 * Server bazasi bilan sinxronlash uchun tayyorlangan payload yaratish
 */
export function createServerSyncPayload(report: MasteryReport): {
  student_code: string;
  synced_at: string;
  overall_mastery: number;
  theta: number;
  overall_depth: string;
  topics_data: Array<{
    topic_slug: string;
    mastery: number;
    bkt_prob: number;
    depth_status: string;
    is_decayed: boolean;
  }>;
} {
  const avgTheta = report.topics.length
    ? Number((report.topics.reduce((s, t) => s + (t.irtTheta ?? 0), 0) / report.topics.length).toFixed(3))
    : 0.0;

  const avgMastery = report.topics.length
    ? Math.round(report.topics.reduce((s, t) => s + t.mastery, 0) / report.topics.length)
    : 0;

  return {
    student_code: report.studentId,
    synced_at: report.generatedAt,
    overall_mastery: avgMastery,
    theta: avgTheta,
    overall_depth: report.overallDepth,
    topics_data: report.topics.map((t) => ({
      topic_slug: t.topicSlug,
      mastery: t.mastery,
      bkt_prob: t.bktProbability,
      depth_status: t.depthAnalysis.depthStatus,
      is_decayed: t.retention.isDecayed,
    })),
  };
}
