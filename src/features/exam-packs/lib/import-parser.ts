import type { StrictPackImportSource } from "@/shared/api/questlab-api";

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export type DraftItem = {
  test?: number;
  test_slug?: string;
  title?: string;
  order?: number;
  is_required?: boolean;
};

export type ImportTest = StrictPackImportSource["tests"][number];
export type ImportQuestion = ImportTest["questions"][number];

export type LooseImportSource = Partial<StrictPackImportSource> & {
  test?: ImportTest;
  questions?: ImportQuestion[];
  examPack?: unknown;
  exam_pack?: unknown;
  packInfo?: unknown;
  testlar?: unknown[];
  title?: string;
  subject?: string;
  category?: string;
  topic?: string;
  branch?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  estimated_minutes?: number;
  time_limit_minutes?: number;
  items?: unknown[];
};

export const templateCsv = "test_slug,title,order,is_required\nalgebra-basics,Algebra warmup,1,true\nquadratics-basics,Quadratics drill,2,true\n";
const optionIds = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function parseCsv(text: string): DraftItem[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasHeader = lines[0]?.toLowerCase().includes("test_slug") || lines[0]?.toLowerCase().includes("slug");
  return (hasHeader ? lines.slice(1) : lines).map((line, index) => {
    const [testSlug, itemTitle, orderValue, requiredValue] = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return {
      test_slug: testSlug,
      title: itemTitle || testSlug,
      order: Number(orderValue || index + 1),
      is_required: requiredValue ? requiredValue.toLowerCase() !== "false" : true,
    };
  }).filter((item) => item.test_slug);
}

export function parseLines(text: string): DraftItem[] {
  return text.split(/\r?\n/).map((line, index) => {
    const [slug, itemTitle] = line.split(/[,;\t]/).map((value) => value.trim());
    return { test_slug: slug, title: itemTitle || slug, order: index + 1, is_required: true };
  }).filter((item) => item.test_slug);
}

export type PackUsage = { attempts: number; students_submitted: number; average_score: number };
export type ImportLayer = "client_parse" | "client_schema" | "api_transport" | "backend_schema" | "backend_db";
export type ImportMode = "json" | "csv" | "md" | "existing";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function readString(source: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

export function readNumber(source: Record<string, unknown>, keys: string[], fallback: number) {
  for (const key of keys) {
    const value = source[key];
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[^\d.]/g, "")) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function readStringList(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value.map((item) => readString({ item }, ["item"])).filter(Boolean);
  }
  if (typeof value === "string") return value.split(/[|,\n]/).map((item) => item.trim()).filter(Boolean);
  return fallback;
}

export function readQuestions(source: Record<string, unknown>) {
  const candidates = [source.questions, source.test_questions, source.savollar];
  const rows = candidates.find(Array.isArray);
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => isRecord(item) && isRecord(item.question) ? item.question : item);
}

function normalizeQuestionType(value: string): ImportQuestion["type"] {
  const normalized = value.toLowerCase().replace("-", "_");
  if (normalized === "multiple_choice") return "multiple_choice";
  if (normalized === "short_answer") return "short_answer";
  return "single_choice";
}

export function normalizeDifficulty(value: string): ImportTest["difficulty"] {
  const normalized = value.toLowerCase();
  if (["hard", "advanced"].includes(normalized)) return "hard";
  if (["medium", "intermediate"].includes(normalized)) return "medium";
  return "easy";
}

function normalizeOptions(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      if (isRecord(item)) {
        const text = readString(item, ["text", "label", "value", "body", "title"]);
        return text ? { id: readString(item, ["id", "key"], optionIds[index] ?? String(index + 1)), text } : null;
      }
      const text = readString({ item }, ["item"]);
      return text ? { id: optionIds[index] ?? String(index + 1), text } : null;
    }).filter((item): item is { id: string; text: string } => Boolean(item));
  }
  if (isRecord(raw)) {
    return Object.entries(raw).map(([id, value]) => ({ id, text: readString({ value }, ["value"]) })).filter((item) => item.text);
  }
  return [];
}

export function normalizeQuestion(raw: unknown, fallbackDifficulty: ImportTest["difficulty"]): ImportQuestion | null {
  if (!isRecord(raw)) return null;
  const options = normalizeOptions(raw.options ?? raw.choices ?? raw.answers ?? raw.variantlar);
  const answer = raw.answer ?? raw.javob;
  const correct = isRecord(answer)
    ? readString(answer, ["correct", "id", "value", "text"])
    : readString(raw, ["correct", "correct_answer", "correctAnswer", "answer", "answer_key", "answerKey", "javob", "togri_javob", "to'g'ri_javob"]);
  const body = readString(raw, ["body", "prompt", "question", "text", "savol", "matn"]);
  if (!body && !options.length && !correct) return null;
  return {
    type: normalizeQuestionType(readString(raw, ["type"], options.length ? "single_choice" : "short_answer")),
    body,
    options,
    answer: { correct },
    explanation: readString(raw, ["explanation", "solution", "commentary", "yechim", "izoh"]),
    skills: readStringList(raw.skills ?? raw.skill ?? raw.tags ?? raw.konikmalar, ["general"]),
    difficulty: normalizeDifficulty(readString(raw, ["difficulty", "level"], fallbackDifficulty)),
  };
}

export function normalizeTest(raw: unknown, fallbackTitle: string, fallbackTopic: string): ImportTest | null {
  if (!isRecord(raw)) return null;
  const difficulty = normalizeDifficulty(readString(raw, ["difficulty", "level"], "easy"));
  const questions = readQuestions(raw).map((question) => normalizeQuestion(question, difficulty)).filter((question): question is ImportQuestion => Boolean(question));
  if (!questions.length) return null;
  return {
    title: readString(raw, ["title", "name", "nom"], fallbackTitle),
    topic: readString(raw, ["topic", "topic_slug", "category", "branch", "subject", "bolim", "bo'lim"], fallbackTopic),
    difficulty,
    time_limit_minutes: readNumber(raw, ["time_limit_minutes", "estimated_minutes", "estimatedMinutes", "minutes", "duration", "vaqt"], 15),
    questions,
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const objectStart = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  if (!starts.length) return trimmed;
  const start = Math.min(...starts);
  const end = trimmed[start] === "[" ? trimmed.lastIndexOf("]") : trimmed.lastIndexOf("}");
  return end > start ? trimmed.slice(start, end + 1) : trimmed;
}

function escapeLooseJsonBackslashes(text: string) {
  let output = "";
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] ?? "";
    if (!inString) {
      output += char;
      if (char === '"') inString = true;
      continue;
    }
    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }
    if (char === '"') {
      output += char;
      inString = false;
      continue;
    }
    if (char !== "\\") {
      output += char;
      continue;
    }
    const afterNext = text[index + 2] ?? "";
    const jsonEscape = next === '"' || next === "\\" || next === "/" || next === "n" || next === "r" || next === "t" || next === "b" || next === "f";
    const looksLikeLatexCommand = /[bfnrt]/.test(next) && /[A-Za-z]/.test(afterNext);
    const validUnicodeEscape = next === "u" && /^[0-9a-fA-F]{4}$/.test(text.slice(index + 2, index + 6));
    if ((jsonEscape && !looksLikeLatexCommand) || validUnicodeEscape) {
      output += char;
      escaped = true;
    } else {
      output += "\\\\";
    }
  }
  return output;
}

function parseJsonValue(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    try {
      return JSON.parse(escapeLooseJsonBackslashes(text)) as unknown;
    } catch {
      throw error;
    }
  }
}

export function normalizeJsonTextareaBackslashes(text: string) {
  return text.replace(/\\+/g, (slashes) => slashes.length % 2 === 0 ? slashes : `${slashes}\\`);
}

export function parsePastedValue(text: string) {
  const jsonText = extractJson(text);
  if (jsonText.startsWith("{") || jsonText.startsWith("[")) return parseJsonValue(jsonText);
  return parseLines(text);
}

export function firstArray(...values: unknown[]) {
  return values.find(Array.isArray) as unknown[] | undefined;
}

export function importShapeSummary(raw: unknown) {
  if (Array.isArray(raw)) return `top=array(${raw.length}), first_keys=${isRecord(raw[0]) ? Object.keys(raw[0]).join(",") : "none"}`;
  if (!isRecord(raw)) return `top=${typeof raw}`;
  const packItems = isRecord(raw.pack) && Array.isArray(raw.pack.items) ? raw.pack.items : undefined;
  const rows = firstArray(raw.items, packItems, raw.tests);
  return `top_keys=${Object.keys(raw).join(",") || "none"}, rows=${rows?.length ?? 0}, first_row_keys=${rows?.[0] && isRecord(rows[0]) ? Object.keys(rows[0]).join(",") : "none"}`;
}

export function inferPackTitle(raw: unknown, fallback: string) {
  if (isRecord(raw)) {
    const direct = readString(raw, ["title", "name", "nom", "subject", "branch", "topic", "category"]);
    if (direct) return direct;
    const packTitle = isRecord(raw.pack) ? readString(raw.pack, ["title", "name", "nom", "subject", "branch", "topic", "category"]) : "";
    if (packTitle) return packTitle;
    const rows = firstArray(raw.tests, raw.questions, raw.items);
    const rowTitle = rows?.find(isRecord);
    if (rowTitle) return readString(rowTitle, ["title", "name", "nom", "subject", "branch", "topic", "category"], fallback);
  }
  return fallback;
}
