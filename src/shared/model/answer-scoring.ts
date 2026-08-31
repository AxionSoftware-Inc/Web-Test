export type ScorableQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "short_answer"
  | "multiple-choice"
  | "short-answer";

/**
 * Client-side answer normalization mirrors backend/learning/services/scoring.py.
 * The backend remains authoritative after a session is submitted.
 */
export function normalizeAnswer(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .replace(/\\cdot/g, "*")
    .replace(/\\/g, "");
}

function answerValues(value: unknown) {
  if (Array.isArray(value)) {
    return new Set(value.map(normalizeAnswer).filter(Boolean));
  }

  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) return new Set<string>();

  try {
    const parsed = JSON.parse(normalizedValue) as unknown;
    if (Array.isArray(parsed)) return answerValues(parsed);
  } catch {
    // Plain text answers are the normal transport format.
  }

  return new Set(
    normalizedValue
      .split(/\s*[,;|]\s*/)
      .map(normalizeAnswer)
      .filter(Boolean),
  );
}

export function isAnswerCorrectForType(type: ScorableQuestionType, correct: unknown, submitted: unknown) {
  if (type === "multiple_choice" || type === "multiple-choice") {
    const expected = answerValues(correct);
    const actual = answerValues(submitted);
    return expected.size > 0 && actual.size === expected.size && [...actual].every((value) => expected.has(value));
  }

  const expected = normalizeAnswer(correct);
  const actual = normalizeAnswer(submitted);
  return Boolean(actual) && actual === expected;
}
