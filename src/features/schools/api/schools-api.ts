import { apiGet, apiPatch, apiPost } from "@/shared/api/client";
import type {
  ApiClassStudent,
  ApiSchool,
  ApiSchoolAnalytics,
  ApiSchoolTeacher,
  ApiTeacherClass,
} from "@/shared/api/questlab-api";

export const schoolsApi = {
  getSchools() {
    return apiGet<ApiSchool[]>("/schools/");
  },

  getSchool(slug: string) {
    return apiGet<ApiSchool>(`/schools/${slug}/`);
  },

  getSchoolAnalytics(slug: string) {
    return apiGet<ApiSchoolAnalytics>(`/schools/${slug}/analytics/`);
  },

  getSchoolClasses(slug: string) {
    return apiGet<ApiTeacherClass[]>(`/schools/${slug}/classes/`);
  },

  getSchoolStudents(slug: string) {
    return apiGet<ApiClassStudent[]>(`/schools/${slug}/students/`);
  },

  getSchoolTeachers(slug: string) {
    return apiGet<ApiSchoolTeacher[]>(`/schools/${slug}/teachers/`);
  },

  createSchool(payload: {
    name: string;
    slug: string;
    owner_name: string;
    visibility: "public" | "private";
    manage_code?: string;
    description: string;
  }) {
    return apiPost<ApiSchool>("/schools/", payload);
  },

  updateSchool(
    slug: string,
    payload: Partial<Pick<ApiSchool, "name" | "owner_name" | "visibility" | "description">> & { manage_code?: string },
  ) {
    return apiPatch<ApiSchool>(`/schools/${slug}/`, payload);
  },
};
