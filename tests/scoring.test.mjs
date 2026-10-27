import { test, describe } from "node:test";
import assert from "node:assert/strict";

function normalizeAnswer(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[$]/g, "")
    .replace(/[()]/g, "")
    .replace(/\\cdot/g, "*")
    .replace(/\\/g, "");
}

function answerValues(value) {
  if (Array.isArray(value)) {
    return new Set(value.map(normalizeAnswer).filter(Boolean));
  }

  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) return new Set();

  try {
    const parsed = JSON.parse(normalizedValue);
    if (Array.isArray(parsed)) return answerValues(parsed);
  } catch {
    // Plain text answers
  }

  return new Set(
    normalizedValue
      .split(/\s*[,;|]\s*/)
      .map(normalizeAnswer)
      .filter(Boolean),
  );
}

function isAnswerCorrectForType(type, correct, submitted) {
  if (type === "multiple_choice" || type === "multiple-choice") {
    const expected = answerValues(correct);
    const actual = answerValues(submitted);
    return expected.size > 0 && actual.size === expected.size && [...actual].every((value) => expected.has(value));
  }

  const expected = normalizeAnswer(correct);
  const actual = normalizeAnswer(submitted);
  return Boolean(actual) && actual === expected;
}

describe("Answer Scoring & Normalization Tests", () => {
  test("Normalizes simple answers removing whitespaces and casing", () => {
    assert.equal(normalizeAnswer("  42  "), "42");
    assert.equal(normalizeAnswer("X = 5"), "x=5");
  });

  test("Normalizes LaTeX expressions correctly", () => {
    assert.equal(normalizeAnswer("2 \\cdot x"), "2*x");
    assert.equal(normalizeAnswer("(x + 1)"), "x+1");
  });

  test("Matches single choice questions correctly", () => {
    assert.equal(isAnswerCorrectForType("single_choice", "A", "A"), true);
    assert.equal(isAnswerCorrectForType("single_choice", "a", "A "), true);
    assert.equal(isAnswerCorrectForType("single_choice", "A", "B"), false);
  });

  test("Matches multiple choice answer sets regardless of order", () => {
    assert.equal(isAnswerCorrectForType("multiple_choice", ["A", "B"], ["B", "A"]), true);
    assert.equal(isAnswerCorrectForType("multiple_choice", "A, B", "B, A"), true);
    assert.equal(isAnswerCorrectForType("multiple_choice", "A; B; C", "C, A, B"), true);
    assert.equal(isAnswerCorrectForType("multiple_choice", ["A", "B"], ["A"]), false);
    assert.equal(isAnswerCorrectForType("multiple_choice", ["A"], ["A", "B"]), false);
  });

  test("Matches short answers with variable formatting", () => {
    assert.equal(isAnswerCorrectForType("short_answer", "x=24", " x = 24 "), true);
    assert.equal(isAnswerCorrectForType("short_answer", "$x=24$", "x=24"), true);
  });
});
