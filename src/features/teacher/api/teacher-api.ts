import { apiGet, apiPost } from "@/shared/api/client";
import type {
  ApiClassAssignment,
  ApiClassResults,
  ApiClassStudent,
  ApiTeacherClass,
} from "@/shared/api/questlab-api";

export const teacherApi = {
  getTeacherClasses() {
    return apiGet<ApiTeacherClass[]>("/teacher/classes/");
  },

  getTeacherClass(classSlug: string) {
    return apiGet<ApiTeacherClass>(`/teacher/classes/${encodeURIComponent(classSlug)}/`);
  },

  createClass(payload: {
    name: string;
    slug: string;
    teacher_name: string;
    visibility: "public" | "private";
    join_code: string;
    manage_code?: string;
    description: string;
  }) {
    return apiPost<ApiTeacherClass>("/teacher/classes/", payload);
  },

  getClassResults(classSlug: string, manageCode?: string) {
    const q = manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : "";
    return apiGet<ApiClassResults>(`/classes/${encodeURIComponent(classSlug)}/results/${q}`);
  },

  getClassAssignments(classSlug: string) {
    return apiGet<ApiClassAssignment[]>(`/classes/${encodeURIComponent(classSlug)}/assignments/`);
  },

  getClassStudents(classSlug: string) {
    return apiGet<ApiClassStudent[]>(`/classes/${encodeURIComponent(classSlug)}/students/`);
  },
};
