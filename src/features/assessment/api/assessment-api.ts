import { apiGet, apiPost } from "@/shared/api/client";
import type {
  ApiAnswer,
  ApiSession,
  ApiSessionResult,
} from "@/shared/api/questlab-api";

export interface SessionSubmitPayload {
  answers?: Array<{
    question_id: number;
    value: string;
    is_flagged?: boolean;
    client_duration_seconds?: number;
    answer_changes?: number;
  }>;
}

export const assessmentApi = {
  createSession(testSlug: string, studentCode: string, studentName?: string) {
    return apiPost<ApiSession>("/sessions/", {
      test_slug: testSlug,
      student_code: studentCode,
      student_name: studentName,
    });
  },

  getSession(sessionId: number | string) {
    return apiGet<ApiSession>(`/sessions/${sessionId}/`);
  },

  saveAnswer(
    sessionId: number | string,
    questionId: number,
    value: string,
    isFlagged = false,
    analytics?: { client_duration_seconds?: number; answer_changes?: number },
  ) {
    return apiPost<ApiAnswer>(`/sessions/${sessionId}/answers/`, {
      question: questionId,
      value,
      is_flagged: isFlagged,
      ...analytics,
    });
  },

  submitSession(sessionId: number | string, payload?: SessionSubmitPayload) {
    return apiPost<ApiSessionResult>(`/sessions/${sessionId}/submit/`, payload || {});
  },

  getResult(sessionId: number | string) {
    return apiGet<ApiSessionResult>(`/sessions/${sessionId}/result/`);
  },
};
