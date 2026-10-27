import { apiGet } from "@/shared/api/client";
import type {
  ApiProfileSummary,
  ApiSessionResult,
} from "@/shared/api/questlab-api";

export const studentApi = {
  getProfileSummary(studentCode: string) {
    return apiGet<ApiProfileSummary>(`/profile/summary/?student_code=${encodeURIComponent(studentCode)}`);
  },

  getMistakesSummary(studentCode: string) {
    return apiGet<{
      total_mistakes: number;
      topics: Array<{ topic: string; slug: string; mistake_count: number }>;
      mistakes: Array<{
        question_id: number;
        topic: string;
        prompt: string;
        student_answer: string;
        correct_answer: string;
        explanation: string;
      }>;
    }>(`/student/mistakes/?student_code=${encodeURIComponent(studentCode)}`);
  },

  getRecentSessions(studentCode: string) {
    return apiGet<ApiSessionResult[]>(`/student/sessions/?student_code=${encodeURIComponent(studentCode)}`);
  },
};
