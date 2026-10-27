import { apiGet, apiPost } from "@/shared/api/client";
import type {
  ApiMasteryProgress,
  ApiMasteryRecommendation,
  ApiMasteryTopic,
} from "@/shared/api/questlab-api";

export const masteryApi = {
  getMasteryProgress(studentCode: string) {
    return apiGet<ApiMasteryProgress>(`/mastery/progress/?student_code=${encodeURIComponent(studentCode)}`);
  },

  getTopicMastery(studentCode: string, topicSlug: string) {
    return apiGet<ApiMasteryTopic>(
      `/mastery/topics/${encodeURIComponent(topicSlug)}/?student_code=${encodeURIComponent(studentCode)}`,
    );
  },

  getRecommendations(studentCode: string) {
    return apiGet<ApiMasteryRecommendation[]>(
      `/mastery/recommendations/?student_code=${encodeURIComponent(studentCode)}`,
    );
  },

  refreshMastery(studentCode: string) {
    return apiPost<ApiMasteryProgress>(`/mastery/refresh/`, {
      student_code: studentCode,
    });
  },
};
