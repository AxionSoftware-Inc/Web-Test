export { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type ApiSubject = {
  id: number;
  title: string;
  slug: string;
  description: string;
};

export type ApiTopic = {
  id: number;
  subject: number;
  subject_slug: string;
  title: string;
  slug: string;
  description: string;
  test_count: number;
};

export type ApiSkill = {
  id: number;
  topic: number;
  topic_slug: string;
  title: string;
  slug: string;
  description: string;
};

export type ApiQuestion = {
  id: number;
  subject: number;
  topic: number;
  skills: number[];
  skill_titles: string[];
  type: "single_choice" | "multiple_choice" | "short_answer";
  difficulty: "beginner" | "intermediate" | "advanced";
  prompt: string;
  options: string[];
  answer?: string;
  explanation?: string;
};

export type ApiQuestionSolution = ApiQuestion & {
  answer: string;
  explanation: string;
};

export type ApiTestQuestion = {
  order: number;
  question: ApiQuestion;
};

export type ApiTest = {
  id: number;
  title: string;
  slug: string;
  subject: number;
  subject_slug: string;
  topic: number;
  topic_slug: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_minutes: number;
  passing_score: number;
  status: "draft" | "published";
  creator_name: string;
  test_questions: ApiTestQuestion[];
};

export type ApiResultTest = Omit<ApiTest, "test_questions"> & {
  test_questions: Array<{ order: number; question: ApiQuestionSolution }>;
};

export type ApiLevel = {
  difficulty: "beginner" | "intermediate" | "advanced";
  label: string;
  test_count: number;
  tests: ApiTest[];
};

export type CreateTestQuestionPayload = {
  type: ApiQuestion["type"];
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  skills: number[];
};

export type CreateTestPayload = {
  title: string;
  slug: string;
  subject: number;
  topic: number;
  difficulty: ApiTest["difficulty"];
  estimated_minutes: number;
  passing_score: number;
  status: ApiTest["status"];
  creator_name?: string;
  creator_code?: string;
  manage_key?: string;
  questions: CreateTestQuestionPayload[];
};

export type StrictPackImportSource = {
  version: "1.0";
  pack: {
    title: string;
    subject: string;
    branch: string;
    level: string;
    language: string;
  };
  tests: Array<{
    title: string;
    topic: string;
    difficulty: "easy" | "medium" | "hard" | "beginner" | "intermediate" | "advanced";
    time_limit_minutes: number;
    questions: Array<{
      type: ApiQuestion["type"];
      body: string;
      options?: Array<{ id: string; text: string }>;
      answer: { correct: string } | string;
      explanation?: string;
      skills: string[];
      difficulty?: "easy" | "medium" | "hard" | "beginner" | "intermediate" | "advanced";
    }>;
  }>;
};

export type ApiPackImportResult = {
  pack: ApiExamPack;
  tests: ApiTest[];
  skipped: Array<{ title: string; reason: string; layer?: string; code?: string; field?: string }>;
};

export type ApiAnswer = {
  id: number;
  session: number;
  question: number;
  value: string;
  is_flagged: boolean;
};

export type ApiSession = {
  id: number;
  test: number;
  test_title: string;
  test_slug: string;
  student_name: string;
  student_code: string;
  status: "in_progress" | "submitted";
  submitted_at: string | null;
  answers: ApiAnswer[];
  created_at: string;
};

export type ApiSessionResult = {
  session_id: number;
  scoring_version: number;
  test: ApiResultTest;
  summary: {
    correct: number;
    wrong: number;
    skipped: number;
    answered: number;
    total: number;
    score: number;
  };
  questions: Array<{
    order: number;
    question_id: number;
    question: ApiQuestionSolution;
    student_answer: string;
    is_correct: boolean;
  }>;
};

export type ApiProfileSummary = {
  name: string;
  level: string;
  tests_taken: number;
  average_score: number;
  math_mastery: number;
  answered_questions: number;
  correct_answers: number;
  topic_progress: Array<{ topic: string; slug: string; value: number; attempts: number }>;
  weekly_activity: Array<{ day: string; value: number }>;
  recent_tests: Array<{
    id: number;
    title: string;
    slug: string;
    topic: string;
    difficulty: ApiTest["difficulty"];
    score: number;
    correct: number;
    total: number;
    submitted_at: string;
  }>;
  recommendations: Array<{ title: string; description: string; href: string }>;
};

export type ApiTeacherClass = {
  id: number;
  name: string;
  slug: string;
  school: number | null;
  school_slug: string;
  teacher_name: string;
  visibility: "public" | "private";
  join_code?: string;
  manage_code?: string;
  description: string;
  student_count: number;
  assignment_count: number;
  assignments: ApiClassAssignment[];
  created_at: string;
};

export type ApiClassAssignment = {
  id: number;
  classroom: number;
  test: number;
  test_title: string;
  test_slug: string;
  difficulty: ApiTest["difficulty"];
  question_count: number;
  title: string;
  mode: "session" | "homework";
  opens_at: string | null;
  closes_at: string | null;
  due_at: string | null;
  attempt_limit: number;
  show_answers_after_deadline: boolean;
  allow_late_submission: boolean;
  grading_policy: "best" | "latest" | "first";
  is_active: boolean;
  created_at: string;
};

export type ApiClassStudent = {
  id: number;
  classroom: number;
  name: string;
  student_code: string;
  created_at: string;
};

export type ApiClassResults = {
  classroom: ApiTeacherClass;
  attempts: number;
  average_score: number;
  results: Array<{
    session_id: number;
    student_name: string;
    student_code: string;
    test_title: string;
    test_slug: string;
    assignment_id: number | null;
    assignment_title: string;
    assignment_mode: ApiClassAssignment["mode"] | null;
    score: number;
    correct: number;
    total: number;
    submitted_at: string | null;
    is_late: boolean;
  }>;
  weak_skills: Array<{ skill: string; correct: number; total: number; percent: number }>;
  students_total: number;
  students_submitted: number;
  sessions_total: number;
  sessions_open: number;
  assignment_stats: Array<{
    assignment_id: number;
    assignment_title: string;
    test_title: string;
    test_slug: string;
    mode: ApiClassAssignment["mode"];
    due_at: string | null;
    attempt_limit: number;
    show_answers_after_deadline: boolean;
    allow_late_submission: boolean;
    grading_policy: ApiClassAssignment["grading_policy"];
    is_active: boolean;
    attempts: number;
    unique_students: number;
    late_submissions: number;
    average_score: number;
  }>;
  student_progress: Array<{
    student_name: string;
    student_code: string;
    completed: number;
    average_score: number;
    last_submitted_at: string | null;
  }>;
};

export type ApiExamPackItem = {
  id: number;
  pack: number;
  test: number;
  test_title: string;
  test_slug: string;
  difficulty: ApiTest["difficulty"];
  question_count: number;
  title: string;
  order: number;
  is_required: boolean;
  created_at: string;
};

export type ApiExamPack = {
  id: number;
  title: string;
  slug: string;
  description: string;
  exam_type: string;
  visibility: "public" | "private";
  access_code?: string;
  manage_code?: string;
  price_label: string;
  is_active: boolean;
  item_count: number;
  items: ApiExamPackItem[];
  created_at: string;
};

export type ApiExamPackResults = {
  pack: ApiExamPack;
  attempts: number;
  average_score: number;
  results: Array<{
    session_id: number;
    student_name: string;
    test_title: string;
    test_slug: string;
    item_id: number | null;
    item_title: string;
    score: number;
    correct: number;
    total: number;
    submitted_at: string | null;
  }>;
  students_submitted: number;
  items_total: number;
  required_total: number;
  item_stats: Array<{
    item_id: number;
    item_title: string;
    test_title: string;
    test_slug: string;
    is_required: boolean;
    attempts: number;
    unique_students: number;
    average_score: number;
  }>;
  student_progress: Array<{
    student_name: string;
    student_code: string;
    completed: number;
    average_score: number;
    last_submitted_at: string | null;
  }>;
  weak_skills: Array<{ skill: string; correct: number; total: number; percent: number }>;
};

export type ApiSchoolTeacher = {
  id: number;
  school: number;
  name: string;
  email: string;
  teacher_code: string;
  classes: number[];
  class_slugs: string[];
  class_count: number;
  is_active: boolean;
  created_at: string;
};

export type ApiSchool = {
  id: number;
  name: string;
  slug: string;
  owner_name: string;
  manage_code?: string;
  visibility: "public" | "private";
  description: string;
  portal_subdomain: string;
  portal_domain: string;
  logo_url: string;
  primary_color: string;
  accent_color: string;
  student_invite_code?: string;
  teacher_count: number;
  teachers: ApiSchoolTeacher[];
  created_at: string;
};

export type ApiSchoolAnalytics = {
  school: ApiSchool;
  portal_url: string;
  teacher_count: number;
  class_count: number;
  students_submitted: number;
  attempts: number;
  average_score: number;
  teachers: Array<{
    teacher_id: number;
    teacher_name: string;
    email: string;
    class_count: number;
    attempts: number;
    students_submitted: number;
    average_score: number;
    is_active: boolean;
  }>;
  classes: Array<{
    class_id: number;
    class_slug: string;
    class_name: string;
    teacher_id: number;
    teacher_name: string;
    attempts: number;
    students_submitted: number;
    sessions_total: number;
    average_score: number;
  }>;
  weak_skills: Array<{ skill: string; correct: number; total: number; percent: number }>;
};

export type ApiMistakesSummary = {
  mistakes: Array<{
    session_id: number;
    question_id: number;
    test_title: string;
    topic: string;
    prompt: string;
    user_answer: string;
    correct_answer: string;
    explanation: string;
    skills: string[];
  }>;
  weak_skills: Array<{ skill: string; correct: number; total: number; percent: number }>;
};

export type ApiRoleProfile = {
  identity_code: string;
  display_name: string;
  email: string;
  phone: string;
  active_role: "student" | "teacher" | "school" | "creator" | "admin";
  available_roles: ApiRoleProfile["active_role"][];
  created_at: string;
  updated_at: string;
};

export const questApi = {
  subjects: () => apiGet<ApiSubject[]>("/subjects/"),
  topics: (subjectSlug?: string) => apiGet<ApiTopic[]>(`/topics/${subjectSlug ? `?subject=${subjectSlug}` : ""}`),
  skills: () => apiGet<ApiSkill[]>("/skills/"),
  subjectTopics: (subjectSlug: string) => apiGet<ApiTopic[]>(`/subjects/${subjectSlug}/topics/`),
  topicLevels: (topicSlug: string) => apiGet<ApiLevel[]>(`/topics/${topicSlug}/levels/`),
  topicTests: (topicSlug: string, difficulty?: string, status?: ApiTest["status"]) => {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (status) params.set("status", status);
    const query = params.toString();
    return apiGet<ApiTest[]>(`/topics/${topicSlug}/tests/${query ? `?${query}` : ""}`);
  },
  tests: () => apiGet<ApiTest[]>("/tests/"),
  questions: () => apiGet<ApiQuestion[]>("/questions/"),
  question: (id: string) => apiGet<ApiQuestion>(`/questions/${id}/`),
  questionSolution: (id: string) => apiGet<ApiQuestionSolution>(`/questions/${id}/solution/`),
  test: (testSlug: string) => apiGet<ApiTest>(`/tests/${testSlug}/`),
  testManage: (testSlug: string, manageKey: string) => apiGet<ApiResultTest>(`/tests/${testSlug}/manage/?manage_key=${encodeURIComponent(manageKey)}`),
  createTest: (payload: CreateTestPayload) => apiPost<ApiTest>("/tests/", payload),
  importTestPack: (payload: { source: StrictPackImportSource; creator_name?: string; creator_code?: string; manage_key?: string; pack_manage_code?: string }) =>
    apiPost<ApiPackImportResult>("/tests/import-pack/", payload),
  updateTest: (
    testSlug: string,
    payload: Partial<Pick<ApiTest, "title" | "slug" | "subject" | "topic" | "difficulty" | "estimated_minutes" | "passing_score" | "status">> & {
      creator_name?: string;
      creator_code?: string;
      manage_key?: string;
      questions?: CreateTestQuestionPayload[];
    },
  ) =>
    apiPatch<ApiTest>(`/tests/${testSlug}/`, payload),
  deleteTest: (testSlug: string, manageKey?: string) => apiDelete<ApiTest | undefined>(`/tests/${testSlug}/${manageKey ? `?manage_key=${encodeURIComponent(manageKey)}` : ""}`),
  startTest: (testSlug: string, payload?: { student_name?: string; student_code?: string }) => apiPost<ApiSession>(`/tests/${testSlug}/start/`, payload),
  sessions: () => apiGet<ApiSession[]>("/sessions/"),
  session: (sessionId: string) => apiGet<ApiSession>(`/sessions/${sessionId}/`),
  answer: (sessionId: string, payload: { question: number; value: string; is_flagged?: boolean }) =>
    apiPost<ApiSession>(`/sessions/${sessionId}/answer/`, payload),
  submit: (sessionId: string) => apiPost<ApiSession>(`/sessions/${sessionId}/submit/`),
  sessionResult: (sessionId: string) => apiGet<ApiSessionResult>(`/sessions/${sessionId}/result/`),
  roleProfile: (identityCode: string) => apiGet<ApiRoleProfile>(`/profile/role/?identity_code=${encodeURIComponent(identityCode)}`),
  searchRoleProfiles: (query: string, role?: ApiRoleProfile["active_role"]) => apiGet<ApiRoleProfile[]>(`/profile/role-search/?q=${encodeURIComponent(query)}${role ? `&role=${role}` : ""}`),
  updateRoleProfile: (identityCode: string, payload: { active_role?: ApiRoleProfile["active_role"]; display_name?: string; phone?: string }) =>
    apiPatch<ApiRoleProfile>("/profile/role/", { ...payload, identity_code: identityCode }),
  profileSummary: (studentCode?: string) => apiGet<ApiProfileSummary>(`/profile/summary/${studentCode ? `?student_code=${encodeURIComponent(studentCode)}` : ""}`),
  mistakesSummary: (studentCode?: string) => apiGet<ApiMistakesSummary>(`/mistakes/summary/${studentCode ? `?student_code=${encodeURIComponent(studentCode)}` : ""}`),
  classes: () => apiGet<ApiTeacherClass[]>("/classes/"),
  classDetail: (slug: string) => apiGet<ApiTeacherClass>(`/classes/${slug}/`),
  createClass: (payload: {
    name: string;
    slug: string;
    teacher_name: string;
    visibility: "public" | "private";
    join_code: string;
    manage_code?: string;
    description: string;
  }) => apiPost<ApiTeacherClass>("/classes/", payload),
  classAssignments: (slug: string) => apiGet<ApiClassAssignment[]>(`/classes/${slug}/assignments/`),
  createClassAssignment: (
    slug: string,
    payload: {
      test: number;
      title: string;
      mode?: ApiClassAssignment["mode"];
      is_active: boolean;
      opens_at?: string | null;
      closes_at?: string | null;
      due_at?: string | null;
      attempt_limit?: number;
      show_answers_after_deadline?: boolean;
      allow_late_submission?: boolean;
      grading_policy?: ApiClassAssignment["grading_policy"];
      manage_code?: string;
    },
  ) =>
    apiPost<ApiClassAssignment>(`/classes/${slug}/assignments/`, payload),
  bulkCreateClassAssignments: (
    slug: string,
    payload: {
      manage_code?: string;
      assignments: Array<{
        test?: number;
        test_slug?: string;
        title?: string;
        mode?: ApiClassAssignment["mode"];
        is_active?: boolean;
        opens_at?: string | null;
        closes_at?: string | null;
        due_at?: string | null;
        attempt_limit?: number;
        show_answers_after_deadline?: boolean;
        allow_late_submission?: boolean;
        grading_policy?: ApiClassAssignment["grading_policy"];
      }>;
    },
  ) => apiPost<{ created: ApiClassAssignment[]; skipped: Array<{ test_slug: string; reason: string }> }>(`/classes/${slug}/assignments/bulk/`, payload),
  updateClassAssignment: (
    slug: string,
    assignmentId: number,
    payload: Partial<Pick<ApiClassAssignment, "title" | "mode" | "is_active" | "opens_at" | "closes_at" | "due_at" | "attempt_limit" | "show_answers_after_deadline" | "allow_late_submission" | "grading_policy">> & { manage_code?: string },
  ) => apiPatch<ApiClassAssignment>(`/classes/${slug}/assignments/${assignmentId}/`, payload),
  deleteClassAssignment: (slug: string, assignmentId: number, manageCode?: string) =>
    apiDelete<ApiClassAssignment | undefined>(`/classes/${slug}/assignments/${assignmentId}/${manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : ""}`),
  classStudents: (slug: string) => apiGet<ApiClassStudent[]>(`/classes/${slug}/students/`),
  createClassStudent: (slug: string, payload: { name: string; student_code: string; manage_code?: string }) =>
    apiPost<ApiClassStudent>(`/classes/${slug}/students/`, payload),
  joinClass: (slug: string, payload: { student_name: string; join_code?: string; student_code?: string }) =>
    apiPost<{ id: number; name: string; student_code: string }>(`/classes/${slug}/join/`, payload),
  startClassAssignment: (slug: string, assignmentId: number, payload: { student_name: string; join_code?: string; student_code?: string }) =>
    apiPost<ApiSession>(`/classes/${slug}/assignments/${assignmentId}/start/`, payload),
  classResults: (slug: string, manageCode?: string) => apiGet<ApiClassResults>(`/classes/${slug}/results/${manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : ""}`),
  examPacks: () => apiGet<ApiExamPack[]>("/exam-packs/"),
  examPack: (slug: string) => apiGet<ApiExamPack>(`/exam-packs/${slug}/`),
  createExamPack: (payload: {
    title: string;
    slug: string;
    description: string;
    exam_type: string;
    visibility: "public" | "private";
    access_code: string;
    manage_code?: string;
    price_label: string;
    is_active: boolean;
  }) => apiPost<ApiExamPack>("/exam-packs/", payload),
  updateExamPack: (
    slug: string,
    payload: Partial<Pick<ApiExamPack, "title" | "description" | "exam_type" | "visibility" | "access_code" | "price_label" | "is_active">> & { manage_code?: string },
  ) => apiPatch<ApiExamPack>(`/exam-packs/${slug}/`, payload),
  deleteExamPack: (slug: string, manageCode?: string) =>
    apiDelete<ApiExamPack | undefined>(`/exam-packs/${slug}/${manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : ""}`),
  examPackItems: (slug: string) => apiGet<ApiExamPackItem[]>(`/exam-packs/${slug}/items/`),
  createExamPackItem: (slug: string, payload: { test: number; title: string; order: number; is_required: boolean; manage_code?: string }) =>
    apiPost<ApiExamPackItem>(`/exam-packs/${slug}/items/`, payload),
  bulkCreateExamPackItems: (
    slug: string,
    payload: {
      manage_code?: string;
      items: Array<{ test?: number; test_slug?: string; title?: string; order?: number; is_required?: boolean }>;
    },
  ) => apiPost<{ created: ApiExamPackItem[]; skipped: Array<{ test_slug: string; reason: string; layer?: string; code?: string; field?: string }> }>(`/exam-packs/${slug}/items/bulk/`, payload),
  importExamPackTests: (
    slug: string,
    payload: { source: StrictPackImportSource; creator_name?: string; creator_code?: string; manage_key?: string; manage_code?: string },
  ) => apiPost<{ created: ApiExamPackItem[]; tests: ApiTest[]; skipped: Array<{ title: string; reason: string; layer?: string; code?: string; field?: string }> }>(`/exam-packs/${slug}/items/import-tests/`, payload),
  updateExamPackItem: (
    slug: string,
    itemId: number,
    payload: Partial<Pick<ApiExamPackItem, "title" | "order" | "is_required">> & { manage_code?: string },
  ) => apiPatch<ApiExamPackItem>(`/exam-packs/${slug}/items/${itemId}/`, payload),
  deleteExamPackItem: (slug: string, itemId: number, manageCode?: string) =>
    apiDelete<ApiExamPackItem | undefined>(`/exam-packs/${slug}/items/${itemId}/${manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : ""}`),
  startExamPackItem: (slug: string, itemId: number, payload: { student_name: string; access_code?: string; student_code?: string }) =>
    apiPost<ApiSession>(`/exam-packs/${slug}/items/${itemId}/start/`, payload),
  examPackResults: (slug: string, manageCode?: string) => apiGet<ApiExamPackResults>(`/exam-packs/${slug}/results/${manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : ""}`),
  schools: () => apiGet<ApiSchool[]>("/schools/"),
  school: (slug: string) => apiGet<ApiSchool>(`/schools/${slug}/`),
  createSchool: (payload: {
    name: string;
    slug: string;
    owner_name: string;
    manage_code?: string;
    visibility: "public" | "private";
    description: string;
    portal_subdomain?: string;
    portal_domain?: string;
    logo_url?: string;
    primary_color?: string;
    accent_color?: string;
    student_invite_code?: string;
  }) => apiPost<ApiSchool>("/schools/", payload),
  updateSchool: (
    slug: string,
    payload: Partial<Pick<ApiSchool, "name" | "owner_name" | "visibility" | "description" | "portal_subdomain" | "portal_domain" | "logo_url" | "primary_color" | "accent_color" | "student_invite_code">> & { manage_code?: string },
  ) => apiPatch<ApiSchool>(`/schools/${slug}/`, payload),
  schoolAnalytics: (slug: string) => apiGet<ApiSchoolAnalytics>(`/schools/${slug}/analytics/`),
  schoolClasses: (slug: string) => apiGet<ApiTeacherClass[]>(`/schools/${slug}/classes/`),
  createSchoolClass: (slug: string, payload: {
    name: string;
    slug: string;
    teacher_name: string;
    visibility: "public" | "private";
    join_code: string;
    manage_code?: string;
    description: string;
    teacher_id?: number;
  }) => apiPost<ApiTeacherClass>(`/schools/${slug}/classes/`, payload),
  schoolStudents: (slug: string) => apiGet<ApiClassStudent[]>(`/schools/${slug}/students/`),
  schoolTeachers: (slug: string) => apiGet<ApiSchoolTeacher[]>(`/schools/${slug}/teachers/`),
  schoolTeacher: (slug: string, teacherId: number) => apiGet<ApiSchoolTeacher>(`/schools/${slug}/teachers/${teacherId}/`),
  createSchoolTeacher: (slug: string, payload: { name: string; email?: string; teacher_code?: string; classes?: number[]; manage_code?: string }) =>
    apiPost<ApiSchoolTeacher>(`/schools/${slug}/teachers/`, payload),
  updateSchoolTeacher: (slug: string, teacherId: number, payload: Partial<Pick<ApiSchoolTeacher, "name" | "email" | "teacher_code" | "is_active">> & { classes?: number[]; manage_code?: string }) =>
    apiPatch<ApiSchoolTeacher>(`/schools/${slug}/teachers/${teacherId}/`, payload),
  deleteSchoolTeacher: (slug: string, teacherId: number, manageCode?: string) =>
    apiDelete<ApiSchoolTeacher>(`/schools/${slug}/teachers/${teacherId}/${manageCode ? `?manage_code=${encodeURIComponent(manageCode)}` : ""}`),
};
