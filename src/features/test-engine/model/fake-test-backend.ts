import { isAnswerCorrect } from "@/features/assessment/lib/assessment-scoring";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

export type FakeSessionAnswer = {
  questionId: string;
  answer: string;
  flagged: boolean;
  visited: boolean;
};

export type FakeSessionState = {
  sessionId: string;
  testSlug: string;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, FakeSessionAnswer>;
};

const storagePrefix = "questlab:test-session:";

export function getFakeSession(sessionId: string, testSlug: string): FakeSessionState {
  if (typeof window === "undefined") {
    return createDefaultSession(sessionId, testSlug);
  }

  const raw = window.localStorage.getItem(getStorageKey(sessionId));

  if (!raw) {
    const session = createDefaultSession(sessionId, testSlug);
    saveFakeSession(session);
    return session;
  }

  try {
    return JSON.parse(raw) as FakeSessionState;
  } catch {
    const session = createDefaultSession(sessionId, testSlug);
    saveFakeSession(session);
    return session;
  }
}

export function saveFakeSession(session: FakeSessionState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(session.sessionId), JSON.stringify(session));
}

export function getAllFakeSessions() {
  if (typeof window === "undefined") {
    return [] as FakeSessionState[];
  }

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(storagePrefix))
    .map((key) => {
      try {
        return JSON.parse(window.localStorage.getItem(key) ?? "") as FakeSessionState;
      } catch {
        return null;
      }
    })
    .filter((session): session is FakeSessionState => Boolean(session));
}

export function setFakeAnswer(
  session: FakeSessionState,
  questionId: string,
  answer: string,
) {
  const next = {
    ...session,
    answers: {
      ...session.answers,
      [questionId]: {
        questionId,
        answer,
        flagged: session.answers[questionId]?.flagged ?? false,
        visited: true,
      },
    },
  };

  saveFakeSession(next);
  return next;
}

export function toggleFakeFlag(session: FakeSessionState, questionId: string) {
  const current = session.answers[questionId];
  const next = {
    ...session,
    answers: {
      ...session.answers,
      [questionId]: {
        questionId,
        answer: current?.answer ?? "",
        flagged: !(current?.flagged ?? false),
        visited: true,
      },
    },
  };

  saveFakeSession(next);
  return next;
}

export function markFakeVisited(session: FakeSessionState, questionId: string) {
  const current = session.answers[questionId];
  const next = {
    ...session,
    answers: {
      ...session.answers,
      [questionId]: {
        questionId,
        answer: current?.answer ?? "",
        flagged: current?.flagged ?? false,
        visited: true,
      },
    },
  };

  saveFakeSession(next);
  return next;
}

export function submitFakeSession(session: FakeSessionState) {
  const next = {
    ...session,
    submittedAt: new Date().toISOString(),
  };

  saveFakeSession(next);
  return next;
}

export function resetFakeSession(sessionId: string, testSlug: string) {
  const next = createDefaultSession(sessionId, testSlug);
  saveFakeSession(next);
  return next;
}

export function getFakeSessionStats(session: FakeSessionState, questions: GeneratedQuestion[]) {
  const answered = questions.filter((question) => Boolean(session.answers[question.id]?.answer)).length;
  const flagged = questions.filter((question) => session.answers[question.id]?.flagged).length;
  const visited = questions.filter((question) => session.answers[question.id]?.visited).length;
  const correct = questions.filter((question) => isAnswerCorrect(question, session.answers[question.id]?.answer ?? "")).length;
  const percent = questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100);

  return {
    answered,
    unanswered: questions.length - answered,
    flagged,
    visited,
    correct,
    wrong: answered - correct,
    skipped: questions.length - answered,
    total: questions.length,
    percent,
  };
}

function createDefaultSession(sessionId: string, testSlug: string): FakeSessionState {
  return {
    sessionId,
    testSlug,
    startedAt: new Date().toISOString(),
    answers: {},
  };
}

function getStorageKey(sessionId: string) {
  return `${storagePrefix}${sessionId}`;
}
