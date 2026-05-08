const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

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
  test_questions: ApiTestQuestion[];
};

export type ApiLevel = {
  difficulty: "beginner" | "intermediate" | "advanced";
  label: string;
  test_count: number;
  tests: ApiTest[];
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
  status: "in_progress" | "submitted";
  submitted_at: string | null;
  answers: ApiAnswer[];
  created_at: string;
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const questApi = {
  subjects: () => apiGet<ApiSubject[]>("/subjects/"),
  subjectTopics: (subjectSlug: string) => apiGet<ApiTopic[]>(`/subjects/${subjectSlug}/topics/`),
  topicLevels: (topicSlug: string) => apiGet<ApiLevel[]>(`/topics/${topicSlug}/levels/`),
  topicTests: (topicSlug: string, difficulty?: string) =>
    apiGet<ApiTest[]>(`/topics/${topicSlug}/tests/${difficulty ? `?difficulty=${difficulty}` : ""}`),
  questions: () => apiGet<ApiQuestion[]>("/questions/"),
  question: (id: string) => apiGet<ApiQuestion>(`/questions/${id}/`),
  test: (testSlug: string) => apiGet<ApiTest>(`/tests/${testSlug}/`),
  startTest: (testSlug: string) => apiPost<ApiSession>(`/tests/${testSlug}/start/`),
  session: (sessionId: string) => apiGet<ApiSession>(`/sessions/${sessionId}/`),
  answer: (sessionId: string, payload: { question: number; value: string; is_flagged?: boolean }) =>
    apiPost<ApiSession>(`/sessions/${sessionId}/answer/`, payload),
  submit: (sessionId: string) => apiPost<ApiSession>(`/sessions/${sessionId}/submit/`),
};
