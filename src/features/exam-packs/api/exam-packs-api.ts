import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/api/client";
import type {
  ApiExamPack,
  ApiExamPackResults,
  ApiPackImportResult,
  StrictPackImportSource,
} from "@/shared/api/questlab-api";

export interface CreateExamPackPayload {
  title: string;
  slug: string;
  description: string;
  exam_type: string;
  visibility: "public" | "private";
  access_code?: string;
  price_label?: string;
  creator_code?: string;
  manage_code?: string;
}

export const examPacksApi = {
  getExamPacks(creatorCode?: string) {
    const q = creatorCode ? `?creator_code=${encodeURIComponent(creatorCode)}` : "";
    return apiGet<ApiExamPack[]>(`/exam-packs/${q}`);
  },

  getExamPack(slug: string) {
    return apiGet<ApiExamPack>(`/exam-packs/${slug}/`);
  },

  getExamPackResults(slug: string, manageCode?: string) {
    const q = manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : "";
    return apiGet<ApiExamPackResults>(`/exam-packs/${slug}/results/${q}`);
  },

  createExamPack(payload: CreateExamPackPayload) {
    return apiPost<ApiExamPack>("/exam-packs/", payload);
  },

  updateExamPack(slug: string, payload: Partial<CreateExamPackPayload>, manageCode?: string) {
    return apiPatch<ApiExamPack>(`/exam-packs/${slug}/`, {
      ...payload,
      manage_code: manageCode,
    });
  },

  deleteExamPack(slug: string, manageCode?: string) {
    return apiDelete<ApiExamPack | undefined>(
      `/exam-packs/${slug}/${manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : ""}`,
    );
  },

  importPack(payload: StrictPackImportSource, options?: { creator_code?: string; manage_key?: string }) {
    return apiPost<ApiPackImportResult>("/exam-packs/import/", {
      ...payload,
      ...options,
    });
  },
};
