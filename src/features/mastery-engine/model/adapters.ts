import { normalizeAnswer } from "@/features/assessment/lib/assessment-scoring";
import type { ApiSession, ApiTest } from "@/shared/api/questlab-api";
import type { QuestionDifficulty, SessionAnswerSnapshot } from "./types";

type SessionVisibility = "personal" | "class" | "school";

export function apiSessionToAnswerSnapshots(input: {
  session: ApiSession;
  test: ApiTest;
  studentId?: string;
  visibility?: SessionVisibility;
  classId?: string;
  answeredAt?: string;
  timeSpentByQuestionId?: Record<string | number, number>;
}): SessionAnswerSnapshot[] {
  const answerByQuestionId = new Map(input.session.answers.map((answer) => [answer.question, answer]));
  const estimatedSecondsPerQuestion = Math.round((input.test.estimated_minutes * 60) / Math.max(1, input.test.test_questions.length));
  const answeredAt = input.answeredAt ?? input.session.submitted_at ?? input.session.created_at;
  const session = input.session as ApiSession & { classroom?: number | string | null };

  return input.test.test_questions.map((row) => {
    const answer = answerByQuestionId.get(row.question.id);
    const selectedAnswer = answer?.value ?? "";
    const isCorrect = normalizeAnswer(selectedAnswer) === normalizeAnswer(row.question.answer ?? "");
    const difficulty = mapApiDifficulty(row.question.difficulty);
    const timeSpentSeconds = input.timeSpentByQuestionId?.[row.question.id] ?? input.timeSpentByQuestionId?.[String(row.question.id)] ?? estimatedSecondsPerQuestion;

    return {
      id: answer ? String(answer.id) : `${input.session.id}-${row.question.id}`,
      studentId: input.studentId ?? (input.session.student_code || input.session.student_name || "anonymous"),
      sessionId: String(input.session.id),
      testId: String(input.test.id),
      questionId: String(row.question.id),
      selectedAnswer,
      correctAnswer: row.question.answer ?? "",
      isCorrect,
      timeSpentSeconds,
      answeredAt,
      subject: row.question.subject ? input.test.subject_slug : input.test.subject_slug,
      topic: input.test.topic_slug,
      topicSlug: input.test.topic_slug,
      skills: row.question.skill_titles.length ? row.question.skill_titles : ["general"],
      difficulty,
      estimatedSeconds: estimatedSecondsPerQuestion,
      masteryWeight: difficulty === "hard" ? 1.75 : difficulty === "medium" ? 1.35 : 1,
      isFundamental: isFundamentalTopic(input.test.topic_slug),
      prerequisites: defaultPrerequisites(input.test.topic_slug),
      questionTitle: input.test.title,
      questionPreview: row.question.prompt,
      explanation: row.question.explanation ?? "",
      visibility: input.visibility ?? (session.classroom ? "class" : "personal"),
      classId: input.classId ?? (session.classroom ? String(session.classroom) : undefined),
    } satisfies SessionAnswerSnapshot;
  });
}

export function apiSessionsToAnswerSnapshots(input: {
  sessions: ApiSession[];
  tests: ApiTest[];
  studentId?: string;
  visibility?: SessionVisibility;
  classId?: string;
  timeSpentBySessionId?: Record<string | number, Record<string | number, number>>;
}) {
  const testsById = new Map(input.tests.map((test) => [test.id, test]));
  return input.sessions
    .filter((session) => session.status === "submitted")
    .flatMap((session) => {
      const test = testsById.get(session.test);
      if (!test) return [];
      return apiSessionToAnswerSnapshots({
        session,
        test,
        studentId: input.studentId,
        visibility: input.visibility,
        classId: input.classId,
        timeSpentByQuestionId: input.timeSpentBySessionId?.[session.id] ?? input.timeSpentBySessionId?.[String(session.id)],
      });
    });
}

export function mapApiDifficulty(value: ApiTest["difficulty"]): QuestionDifficulty {
  if (value === "advanced") return "hard";
  if (value === "intermediate") return "medium";
  return "easy";
}

function isFundamentalTopic(topicSlug: string) {
  return ["linear-equations", "fraction-equations", "sign-handling", "factoring"].includes(topicSlug);
}

function defaultPrerequisites(topicSlug: string) {
  const map: Record<string, string[]> = {
    "fraction-equations": ["linear-equations"],
    inequalities: ["linear-equations", "sign-handling"],
    factoring: ["linear-equations"],
    "quadratic-equations": ["linear-equations", "factoring"],
    "square-roots": ["linear-equations"],
  };
  return map[topicSlug] ?? [];
}
