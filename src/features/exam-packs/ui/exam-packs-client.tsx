"use client";

import { Check, FileJson, FileSpreadsheet, FileText, Layers3, Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { ApiExamPack, ApiTest, StrictPackImportSource } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getPackManageCode, savePackManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, PremiumPanel, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

type DraftItem = {
  test?: number;
  test_slug?: string;
  title?: string;
  order?: number;
  is_required?: boolean;
};

type ImportTest = StrictPackImportSource["tests"][number];
type ImportQuestion = ImportTest["questions"][number];

type LooseImportSource = Partial<StrictPackImportSource> & {
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

const templateCsv = "test_slug,title,order,is_required\nalgebra-basics,Algebra warmup,1,true\nquadratics-basics,Quadratics drill,2,true\n";

const optionIds = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function parseCsv(text: string): DraftItem[] {
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

function parseLines(text: string): DraftItem[] {
  return text.split(/\r?\n/).map((line, index) => {
    const [slug, itemTitle] = line.split(/[,;\t]/).map((value) => value.trim());
    return { test_slug: slug, title: itemTitle || slug, order: index + 1, is_required: true };
  }).filter((item) => item.test_slug);
}

type PackUsage = { attempts: number; students_submitted: number; average_score: number };
type ImportLayer = "client_parse" | "client_schema" | "api_transport" | "backend_schema" | "backend_db";
type ImportMode = "json" | "csv" | "md" | "existing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(source: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function readNumber(source: Record<string, unknown>, keys: string[], fallback: number) {
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
  if (typeof value === "string") {
    return value.split(/[|,\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return fallback;
}

function readQuestions(source: Record<string, unknown>) {
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

function normalizeDifficulty(value: string): ImportTest["difficulty"] {
  const normalized = value.toLowerCase();
  if (["hard", "advanced"].includes(normalized)) return "advanced";
  if (["medium", "intermediate"].includes(normalized)) return "intermediate";
  return "beginner";
}

function normalizeOptions(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => {
        if (isRecord(item)) {
          const text = readString(item, ["text", "label", "value", "body", "title"]);
          return text ? { id: readString(item, ["id", "key"], optionIds[index] ?? String(index + 1)), text } : null;
        }
        const text = readString({ item }, ["item"]);
        return text ? { id: optionIds[index] ?? String(index + 1), text } : null;
      })
      .filter((item): item is { id: string; text: string } => Boolean(item));
  }
  if (isRecord(raw)) {
    return Object.entries(raw)
      .map(([id, value]) => ({ id, text: readString({ value }, ["value"]) }))
      .filter((item) => item.text);
  }
  return [];
}

function normalizeQuestion(raw: unknown, fallbackDifficulty: ImportTest["difficulty"]): ImportQuestion | null {
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

function normalizeTest(raw: unknown, fallbackTitle: string, fallbackTopic: string): ImportTest | null {
  if (!isRecord(raw)) return null;
  const difficulty = normalizeDifficulty(readString(raw, ["difficulty", "level"], "beginner"));
  const questions = readQuestions(raw)
    .map((question) => normalizeQuestion(question, difficulty))
    .filter((question): question is ImportQuestion => Boolean(question));
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

function normalizeJsonTextareaBackslashes(text: string) {
  return text.replace(/\\+/g, (slashes) => slashes.length % 2 === 0 ? slashes : `${slashes}\\`);
}

function parsePastedValue(text: string) {
  const jsonText = extractJson(text);
  if (jsonText.startsWith("{") || jsonText.startsWith("[")) return parseJsonValue(jsonText);
  return parseLines(text);
}

function firstArray(...values: unknown[]) {
  return values.find(Array.isArray) as unknown[] | undefined;
}

function importShapeSummary(raw: unknown) {
  if (Array.isArray(raw)) return `top=array(${raw.length}), first_keys=${isRecord(raw[0]) ? Object.keys(raw[0]).join(",") : "none"}`;
  if (!isRecord(raw)) return `top=${typeof raw}`;
  const packItems = isRecord(raw.pack) && Array.isArray(raw.pack.items) ? raw.pack.items : undefined;
  const rows = firstArray(raw.items, packItems, raw.tests);
  return `top_keys=${Object.keys(raw).join(",") || "none"}, rows=${rows?.length ?? 0}, first_row_keys=${rows?.[0] && isRecord(rows[0]) ? Object.keys(rows[0]).join(",") : "none"}`;
}

function inferPackTitle(raw: unknown, fallback: string) {
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

export function ExamPacksClient({ initialPacks, tests, usageBySlug = {} }: { initialPacks: ApiExamPack[]; tests: ApiTest[]; usageBySlug?: Record<string, PackUsage> }) {
  const [packs, setPacks] = useState(initialPacks);
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [accessCode, setAccessCode] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [mode, setMode] = useState<"select" | "draft">("draft");
  const [importMode, setImportMode] = useState<ImportMode>("json");
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [pasteValue, setPasteValue] = useState("");
  const [csvValue, setCsvValue] = useState("");
  const [mdValue, setMdValue] = useState("");
  const [jsonSource, setJsonSource] = useState<StrictPackImportSource | null>(null);
  const [loadedFileName, setLoadedFileName] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const filteredTests = useMemo(() => {
    const value = testQuery.toLowerCase();
    return tests.filter((test) => `${test.title} ${test.slug} ${test.difficulty} ${test.topic_slug}`.toLowerCase().includes(value));
  }, [testQuery, tests]);

  const selectedItems = useMemo<DraftItem[]>(() => selectedTestIds.map((id, index) => {
    const test = tests.find((item) => item.id === id);
    return { test: id, title: test?.title, order: index + 1, is_required: true };
  }), [selectedTestIds, tests]);

  const itemsToCreate = mode === "select" ? selectedItems : draftItems;

  function setWarning(message: string) {
    setNotice("");
    setError(message);
  }

  function setImportError(layer: ImportLayer, code: string, message: string) {
    setWarning(`[${layer}/${code}] ${message}`);
  }

  function duplicateTitle(candidate: string) {
    const normalized = candidate.trim().toLowerCase();
    return Boolean(normalized && packs.some((pack) => pack.title.trim().toLowerCase() === normalized));
  }

  function requireUniqueTitle(candidate = title) {
    if (!candidate.trim()) {
      setImportError("client_schema", "pack_title_missing", "Pack title bo'sh bo'lmasligi kerak.");
      return false;
    }
    if (duplicateTitle(candidate)) {
      setImportError("client_schema", "pack_title_duplicate", `"${candidate}" nomli pack allaqachon bor. Nomini o'zgartiring.`);
      return false;
    }
    return true;
  }

  function applyPackInfoFromSource(source: StrictPackImportSource, overwriteFilled = false) {
    const nextTitle = source.pack.title?.trim();
    if (nextTitle && (overwriteFilled || !title.trim())) setTitle(nextTitle);
    const subject = source.pack.subject?.trim();
    const branch = source.pack.branch?.trim();
    const level = source.pack.level?.trim();
    const nextExamType = [subject, branch, level].filter(Boolean).join(" / ");
    const nextDescription = [branch, level, source.pack.language].filter(Boolean).join(" / ");
    if (nextExamType && (overwriteFilled || !examType.trim())) setExamType(nextExamType);
    if (nextDescription && (overwriteFilled || !description.trim())) setDescription(nextDescription);
  }

  function normalizeImportSource(raw: unknown): StrictPackImportSource | null {
    const fallbackPack = {
      title: inferPackTitle(raw, title || "Imported pack"),
      subject: examType.toLowerCase().includes("math") ? "math" : slugify(examType || "general"),
      branch: slugify(examType || title || "general"),
      level: "mixed",
      language: "uz",
    };
    if (Array.isArray(raw)) {
      const tests = raw
        .map((item, index) => normalizeTest(item, `${title} ${index + 1}`, fallbackPack.branch))
        .filter((item): item is ImportTest => Boolean(item));
      if (tests.length) return { version: "1.0", pack: fallbackPack, tests };
      const questions = raw
        .map((item) => normalizeQuestion(item, "beginner"))
        .filter((item): item is ImportQuestion => Boolean(item));
      if (questions.length) {
        return {
          version: "1.0",
          pack: fallbackPack,
          tests: [{ title, topic: fallbackPack.branch, difficulty: "beginner", time_limit_minutes: 15, questions }],
        };
      }
      return null;
    }
    if (!raw || typeof raw !== "object") return null;
    const source = raw as LooseImportSource;
    const sourceRecord = raw as Record<string, unknown>;
    const packRecord = isRecord(source.pack)
      ? source.pack
      : isRecord(source.examPack)
        ? source.examPack
        : isRecord(source.exam_pack)
          ? source.exam_pack
          : isRecord(source.packInfo)
            ? source.packInfo
            : sourceRecord;
    const pack = {
      title: readString(packRecord, ["title", "name", "nom"], fallbackPack.title),
      subject: readString(packRecord, ["subject", "subject_slug"], fallbackPack.subject),
      branch: readString(packRecord, ["branch", "category", "topic", "exam_type", "bolim", "bo'lim"], fallbackPack.branch),
      level: readString(packRecord, ["level", "difficulty"], fallbackPack.level),
      language: readString(packRecord, ["language", "lang"], fallbackPack.language),
    };
    const sourceTests = Array.isArray(source.tests)
      ? source.tests
      : Array.isArray(source.testlar)
        ? source.testlar
        : [];
    if (sourceTests.length) {
      const tests = sourceTests
        .map((item, index) => normalizeTest(item, `${pack.title} ${index + 1}`, pack.branch))
        .filter((item): item is ImportTest => Boolean(item));
      if (tests.length) return { version: "1.0", pack, tests };
      const questions = sourceTests
        .map((item) => normalizeQuestion(item, normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "beginner"))))
        .filter((item): item is ImportQuestion => Boolean(item));
      if (questions.length) {
        return {
          version: "1.0",
          pack,
          tests: [{
            title: readString(sourceRecord, ["title", "name"], pack.title),
            topic: readString(sourceRecord, ["topic", "category", "branch", "subject"], pack.branch),
            difficulty: normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "beginner")),
            time_limit_minutes: readNumber(sourceRecord, ["time_limit_minutes", "estimated_minutes", "estimatedMinutes", "minutes", "duration"], 15),
            questions,
          }],
        };
      }
    }
    if (source.test) {
      const test = normalizeTest(source.test, pack.title, pack.branch);
      if (test) return { version: "1.0", pack, tests: [test] };
    }
    const directQuestions = readQuestions(sourceRecord)
      .map((question) => normalizeQuestion(question, normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "beginner"))))
      .filter((item): item is ImportQuestion => Boolean(item));
    if (directQuestions.length) {
      return {
        version: "1.0",
        pack,
        tests: [{
          title: readString(sourceRecord, ["title", "name"], pack.title),
          topic: readString(sourceRecord, ["topic", "category", "branch"], pack.branch),
          difficulty: normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "beginner")),
          time_limit_minutes: readNumber(sourceRecord, ["time_limit_minutes", "estimated_minutes", "estimatedMinutes", "minutes", "duration"], 15),
          questions: directQuestions,
        }],
      };
    }
    if (Array.isArray(source.items)) {
      const tests = source.items
        .map((item, index) => {
          const candidate = isRecord(item) && isRecord(item.test) ? item.test : item;
          return normalizeTest(candidate, `${pack.title} ${index + 1}`, pack.branch);
        })
        .filter((item): item is ImportTest => Boolean(item));
      if (tests.length) return { version: "1.0", pack, tests };
    }
    return null;
  }

  function normalizeDraftItems(raw: unknown): DraftItem[] {
    const rawRecord = isRecord(raw) ? raw : {};
    const packRecord = isRecord(rawRecord.pack) ? rawRecord.pack : {};
    const examPackRecord = isRecord(rawRecord.examPack) ? rawRecord.examPack : {};
    const rows = Array.isArray(raw)
      ? raw
      : firstArray(rawRecord.items, packRecord.items, examPackRecord.items, rawRecord.pack_items, rawRecord.packItems, rawRecord.tests) ?? [];
    const items: DraftItem[] = [];
    rows.forEach((item, index) => {
      if (!isRecord(item)) return;
      const nestedTest = isRecord(item.test) ? item.test : {};
      const testValue = item.test ?? item.test_id ?? item.testId ?? nestedTest.id;
      const numericTest = typeof testValue === "number" ? testValue : typeof testValue === "string" && /^\d+$/.test(testValue) ? Number(testValue) : undefined;
      const testSlug = readString(item, ["test_slug", "slug", "testSlug"]) || readString(nestedTest, ["slug", "test_slug", "testSlug"]);
      const draftItem: DraftItem = {
        test: numericTest,
        test_slug: testSlug,
        title: readString(item, ["title", "name", "test_title", "testTitle"]) || readString(nestedTest, ["title", "name"]),
        order: readNumber(item, ["order"], index + 1),
        is_required: typeof item.is_required === "boolean" ? item.is_required : item.required !== false,
      };
      if (draftItem.test || draftItem.test_slug) items.push(draftItem);
    });
    return items;
  }

  function skippedMessage(skipped: Array<{ title: string; reason: string }>) {
    if (!skipped.length) return "";
    const reasons = skipped.slice(0, 3).map((item) => {
      const row = item as typeof item & { layer?: string; code?: string; field?: string };
      const prefix = [row.layer, row.code].filter(Boolean).join("/");
      return `${row.title}${prefix ? ` [${prefix}]` : ""}: ${row.reason}`;
    }).join(" | ");
    return `${skipped.length} test yaratilmadi. ${reasons}`;
  }

  async function importStrictSource(source: StrictPackImportSource) {
    if (!source.tests.length) {
      setImportError("client_schema", "tests_empty", "JSON ichida tests bo'sh. Kamida bitta test bo'lmasa pack yaratilmaydi.");
      return;
    }
    applyPackInfoFromSource(source, true);
    if (!requireUniqueTitle(source.pack.title)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await questApi.importTestPack({
        source,
        creator_name: "Creator",
        pack_manage_code: getPackManageCode(),
      });
      savePackManageCode(result.pack.slug, result.pack.manage_code);
      setPasteValue("");
      setJsonSource(null);
      setLoadedFileName("");
      setDraftItems([]);
      setSelectedTestIds([]);
      if (!result.tests.length) {
        setWarning(skippedMessage(result.skipped) || "Hech qanday test yaratilmadi.");
        return;
      }
      setPacks((items) => [result.pack, ...items.filter((item) => item.slug !== result.pack.slug)]);
      setNotice(`${result.pack.title} DBga saqlandi. ${result.tests.length} test yaratildi.`);
      setError(skippedMessage(result.skipped));
    } catch (err) {
      setImportError("api_transport", "import_request_failed", err instanceof Error ? err.message : "Pack import failed.");
    } finally {
      setSaving(false);
    }
  }

  async function createPackWithItems(items: DraftItem[]) {
    const cleanItems = items.filter((item) => item.test || item.test_slug);
    if (!cleanItems.length) {
      setImportError("client_schema", "items_empty", "JSON yoki paste ichida testlar topilmadi. `tests` orqali savollar bilan import qiling yoki `items` ichida `test_slug` bering.");
      return;
    }
    if (!requireUniqueTitle()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const pack = await questApi.createExamPack({
        title,
        slug: `${slugify(title)}-${Date.now().toString().slice(-4)}`,
        description,
        exam_type: examType,
        visibility,
        access_code: visibility === "private" ? accessCode : "",
        manage_code: getPackManageCode(),
        price_label: priceLabel,
        is_active: true,
      });
      savePackManageCode(pack.slug, pack.manage_code);
      if (cleanItems.length) {
        const result = await questApi.bulkCreateExamPackItems(pack.slug, { manage_code: pack.manage_code, items: cleanItems });
        if (!result.created.length) {
          setImportError("backend_db", "no_items_created", `Testlar packga qo'shilmadi. ${result.skipped.slice(0, 3).map((item) => `${item.test_slug || "test"} [${[item.layer, item.code].filter(Boolean).join("/") || "backend"}]: ${item.reason}`).join(" | ")}`);
          return;
        }
        if (result.skipped.length) {
          setError(`${result.skipped.length} test qo'shilmadi. ${result.skipped.slice(0, 2).map((item) => `${item.test_slug || "test"} [${[item.layer, item.code].filter(Boolean).join("/") || "backend"}]: ${item.reason}`).join(" | ")}`);
        }
        pack.item_count = result.created.length;
        pack.items = result.created;
      }
      setPacks((items) => [pack, ...items]);
      setDraftItems([]);
      setSelectedTestIds([]);
      setPasteValue("");
      setLoadedFileName("");
      setNotice(`${pack.title} DBga saqlandi.`);
    } catch (err) {
      setImportError("api_transport", "pack_items_request_failed", err instanceof Error ? err.message : "Exam pack create failed.");
    } finally {
      setSaving(false);
    }
  }

  async function createPackFromDraftItems(items: DraftItem[], raw: unknown) {
    if (!items.length) {
      setImportError("client_schema", "items_empty", `JSON ichida import qilinadigan test topilmadi. Kutilgan format: tests[].questions yoki items[].test_slug. Fayl shakli: ${importShapeSummary(raw)}`);
      return;
    }
    await createPackWithItems(items);
  }

  async function createPack() {
    if (importMode === "csv" && csvValue.trim()) {
      const items = parseCsv(csvValue);
      setDraftItems(items);
      setMode("draft");
      await createPackFromDraftItems(items, csvValue);
      return;
    }
    if (importMode === "md" && mdValue.trim()) {
      try {
        const parsed = parsePastedValue(mdValue);
        const source = normalizeImportSource(parsed);
        if (source) {
          await importStrictSource(source);
          return;
        }
        const items = normalizeDraftItems(parsed);
        await createPackFromDraftItems(items, parsed);
        return;
      } catch (err) {
        setImportError("client_parse", "md_parse_failed", err instanceof Error ? `MD ichidan import parse bo'lmadi: ${err.message}` : "MD parse xatosi.");
        return;
      }
    }
    if (jsonSource) {
      await importStrictSource(jsonSource);
      return;
    }
    const value = pasteValue.trim();
    if (value) {
      try {
        const parsed = parsePastedValue(value);
        const source = normalizeImportSource(parsed);
        if (source) {
          await importStrictSource(source);
          return;
        }
        const items = normalizeDraftItems(parsed);
        await createPackFromDraftItems(items, parsed);
        return;
      } catch (err) {
        setImportError("client_parse", "json_parse_failed", err instanceof Error ? `JSON parse xatosi: ${err.message}` : "JSON parse xatosi.");
        return;
      }
    }
    await createPackWithItems(itemsToCreate);
  }

  async function loadJsonFile(file: File) {
    setError("");
    setNotice("");
    try {
      const text = normalizeJsonTextareaBackslashes(await file.text());
      const parsed = parsePastedValue(text);
      const source = normalizeImportSource(parsed);
      if (source) {
        setLoadedFileName(file.name);
        await importStrictSource(source);
        return;
      }
      const items = normalizeDraftItems(parsed);
      if (items.length || (isRecord(parsed) && (Array.isArray(parsed.items) || (isRecord(parsed.pack) && Array.isArray(parsed.pack.items)) || Array.isArray(parsed.tests)))) {
        setLoadedFileName(file.name);
        await createPackFromDraftItems(items, parsed);
        return;
      }
      setImportError("client_schema", "import_shape_unknown", `JSON ichida tests yoki items topilmadi. Bo'sh pack yaratilmaydi. Fayl shakli: ${importShapeSummary(parsed)}`);
    } catch (err) {
      setImportError("client_parse", "file_parse_failed", err instanceof Error ? err.message : "JSON load failed.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function importCsv(file: File) {
    setError("");
    try {
      const text = await file.text();
      const items = parseCsv(text);
      setCsvValue(text);
      setImportMode("csv");
      setDraftItems(items);
      setJsonSource(null);
      setSelectedTestIds([]);
      setMode("draft");
      setLoadedFileName(file.name);
      setNotice(items.length ? `${items.length} CSV item tayyor. Hali DBga saqlanmadi, chapdagi Create pack bosing.` : "");
      setError(items.length ? "" : "CSV ichida test_slug topilmadi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed.");
    } finally {
      if (csvRef.current) csvRef.current.value = "";
    }
  }

  function handleJsonPasteChange(value: string) {
    const normalized = normalizeJsonTextareaBackslashes(value);
    setPasteValue(normalized);
    setJsonSource(null);
    setDraftItems([]);
    setSelectedTestIds([]);
    setMode("draft");
    setLoadedFileName("");
    setNotice(value.trim() ? "Paste qilingan JSON hali DBga saqlanmagan. Saqlash uchun chapdagi Create pack bosing." : "");
    setError("");
    try {
      const source = normalizeImportSource(parsePastedValue(normalized));
      if (source) applyPackInfoFromSource(source, true);
    } catch {
      // Import may be incomplete while typing; save keeps the real validation path.
    }
  }

  function previewJsonPackInfo() {
    if (!pasteValue.trim()) return;
    try {
      const source = normalizeImportSource(parsePastedValue(pasteValue));
      if (source) applyPackInfoFromSource(source, true);
    } catch {
      // Full validation runs on save; preview should not interrupt typing.
    }
  }

  function toggleTest(testId: number) {
    setJsonSource(null);
    setPasteValue("");
    setLoadedFileName("");
    setSelectedTestIds((current) => current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]);
  }

  function resetImportState(nextMode: ImportMode) {
    setImportMode(nextMode);
    setError("");
    setNotice("");
    if (nextMode !== "json") {
      setPasteValue("");
      setJsonSource(null);
    }
    if (nextMode !== "csv") setCsvValue("");
    if (nextMode !== "md") setMdValue("");
    if (nextMode !== "existing") setSelectedTestIds([]);
  }

  const createLabel = saving
    ? "Creating..."
    : jsonSource
      ? `Create imported pack (${jsonSource.tests.length} tests)`
      : importMode === "csv" && csvValue.trim()
        ? "Create pack from CSV"
        : importMode === "md" && mdValue.trim()
          ? "Create pack from MD"
      : itemsToCreate.length
        ? `Create pack with ${itemsToCreate.length} tests`
        : pasteValue.trim()
          ? "Create pack from pasted JSON"
          : "Create pack";

  return (
    <div className="grid gap-4">
      {error || notice ? (
        <div className={cn("rounded-3xl border px-5 py-4 text-sm font-semibold", error ? "border-red-200 bg-red-50 text-red-700" : "border-[#bfe8d8] bg-[#edf7f3] text-[#276a5b]")}>
          {error || notice}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <PremiumPanel>
        <Eyebrow>Pack info</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold">Create pack</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">Nom, narx va ko&apos;rinishni kiriting. Import/paste qilingan kontent faqat shu tugma bosilganda DBga saqlanadi.</p>
        <div className="mt-6 grid gap-4">
          <Input label="Pack title" value={title} onChange={setTitle} />
          <Input label="Exam type" value={examType} onChange={setExamType} />
          <Input label="Price label" value={priceLabel} onChange={setPriceLabel} />
          <FieldShell label="Visibility">
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")} className={premiumInputClass}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </FieldShell>
          {visibility === "private" ? <Input label="Access code" value={accessCode} onChange={setAccessCode} /> : null}
          <FieldShell label="Description">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={premiumInputClass} />
          </FieldShell>
          <button onClick={createPack} disabled={saving} className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {createLabel}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadJsonFile(file); }} />
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} />
        </div>
      </PremiumPanel>

      <section className="rounded-[24px] border border-black/8 bg-white/82 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-4">
        <div>
          <Eyebrow>Import</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold">Pack import</h2>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <ImportTab active={importMode === "json"} icon={FileJson} label="JSON" onClick={() => resetImportState("json")} />
          <ImportTab active={importMode === "csv"} icon={FileSpreadsheet} label="CSV" onClick={() => resetImportState("csv")} />
          <ImportTab active={importMode === "md"} icon={FileText} label="MD" onClick={() => resetImportState("md")} />
          <ImportTab active={importMode === "existing"} icon={Layers3} label="Tests" onClick={() => { resetImportState("existing"); setMode("select"); }} />
        </div>

        {importMode === "json" ? (
        <section className="mt-4 rounded-2xl border border-black/8 bg-[#fbfbf6] p-3">
          <FieldShell label="Strict JSON yoki { items: [...] }">
            <textarea value={pasteValue} onChange={(event) => handleJsonPasteChange(event.target.value)} onBlur={previewJsonPackInfo} rows={10} className={premiumInputClass} placeholder="{\n  &quot;version&quot;: &quot;1.0&quot;,\n  &quot;pack&quot;: { &quot;title&quot;: &quot;Linear Algebra Foundations&quot;, &quot;subject&quot;: &quot;math&quot;, &quot;branch&quot;: &quot;linear-algebra&quot;, &quot;level&quot;: &quot;foundations&quot;, &quot;language&quot;: &quot;uz&quot; },\n  &quot;tests&quot;: [{\n    &quot;title&quot;: &quot;Vectors Basics&quot;,\n    &quot;topic&quot;: &quot;vectors&quot;,\n    &quot;difficulty&quot;: &quot;beginner&quot;,\n    &quot;time_limit_minutes&quot;: 15,\n    &quot;questions&quot;: [{ &quot;type&quot;: &quot;single_choice&quot;, &quot;body&quot;: &quot;Question text&quot;, &quot;options&quot;: [{ &quot;id&quot;: &quot;A&quot;, &quot;text&quot;: &quot;Option A&quot; }], &quot;answer&quot;: { &quot;correct&quot;: &quot;A&quot; }, &quot;skills&quot;: [&quot;general&quot;] }]\n  }]\n}" />
          </FieldShell>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-white/70 disabled:opacity-50">
              <Upload className="size-4" />
              Upload JSON
            </button>
            {loadedFileName ? <span className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black/55">{loadedFileName}</span> : null}
          </div>
        </section>
        ) : null}

        {importMode === "csv" ? (
          <section className="mt-4 rounded-2xl border border-black/8 bg-[#fbfbf6] p-3">
            <FieldShell label="CSV: test_slug,title,order,is_required">
              <textarea value={csvValue} onChange={(event) => { setCsvValue(event.target.value); setDraftItems(parseCsv(event.target.value)); setMode("draft"); setError(""); setNotice(event.target.value.trim() ? "CSV tayyor. Saqlash uchun chapdagi Create pack bosing." : ""); }} rows={10} className={premiumInputClass} placeholder={templateCsv} />
            </FieldShell>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => csvRef.current?.click()} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-white/70 disabled:opacity-50">
                <Upload className="size-4" />
                Upload CSV
              </button>
              <Link href="/crud" className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-white/70">
                <Plus className="size-4" />
                Manual test
              </Link>
            </div>
          </section>
        ) : null}

        {importMode === "md" ? (
          <section className="mt-4 rounded-2xl border border-black/8 bg-[#fbfbf6] p-3">
            <FieldShell label="Markdown ichidagi ```json ... ``` yoki slug qatorlari">
              <textarea value={mdValue} onChange={(event) => { setMdValue(event.target.value); setError(""); setNotice(event.target.value.trim() ? "MD tayyor. Saqlash uchun chapdagi Create pack bosing." : ""); }} rows={12} className={premiumInputClass} placeholder={"```json\n{ \"version\": \"1.0\", \"pack\": { \"title\": \"Pack title\", \"subject\": \"math\", \"branch\": \"algebra\", \"level\": \"beginner\", \"language\": \"uz\" }, \"tests\": [] }\n```"} />
            </FieldShell>
          </section>
        ) : null}

        {importMode === "existing" && mode === "select" ? (
          <section className="mt-4 rounded-2xl border border-black/8 bg-[#fbfbf6] p-3">
            <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3">
              <Search className="size-4 text-black/35" />
              <input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} placeholder="Test title, slug, topic..." className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="mt-4 grid max-h-[430px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {filteredTests.map((test) => {
                const active = selectedTestIds.includes(test.id);
                return (
                  <button key={test.id} type="button" onClick={() => toggleTest(test.id)} className={cn("rounded-2xl border bg-white p-4 text-left hover:bg-[#f4f2ea]", active ? "border-[#276a5b] ring-2 ring-[#8fd6bd]/40" : "border-black/8")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{test.title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/35">{test.slug}</p>
                      </div>
                      {active ? <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#edf7f3] text-[#276a5b]"><Check className="size-4" /></span> : null}
                    </div>
                    <p className="mt-3 text-sm text-black/52">{test.difficulty} / {test.test_questions.length} questions / {test.estimated_minutes} min</p>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {itemsToCreate.length ? (
          <section className="mt-5 rounded-3xl border border-black/8 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Draft items</p>
              <button onClick={() => { setDraftItems([]); setSelectedTestIds([]); }} className="text-sm font-semibold text-black/45 hover:text-black">Clear</button>
            </div>
            <div className="mt-3 grid gap-2">
              {itemsToCreate.slice(0, 8).map((item, index) => (
                <div key={`${item.test ?? item.test_slug}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbfbf6] px-4 py-3 text-sm">
                  <span className="font-semibold">{item.title || item.test_slug || item.test}</span>
                  <span className="text-black/42">#{item.order ?? index + 1}</span>
                </div>
              ))}
              {itemsToCreate.length > 8 ? <p className="text-sm font-semibold text-black/45">+{itemsToCreate.length - 8} more</p> : null}
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">My packs</h2>
            <p className="mt-1 text-sm text-black/50">O&apos;zingiz yaratgan packlar, ishlatilishi va ichiga kirib edit qilish.</p>
          </div>
          <span className="rounded-full bg-[#edf7f3] px-3 py-1 text-xs font-semibold text-[#276a5b]">{packs.length} packs</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {packs.map((pack) => {
            const usage = usageBySlug[pack.slug];
            return (
              <Link key={pack.id} href={`/exam-packs/${pack.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf8]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{pack.title}</p>
                    <p className="mt-1 text-sm text-black/52">{pack.exam_type}</p>
                  </div>
                  <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-xs font-semibold text-[#276a5b]">{pack.price_label || "Free"}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-black/58">{pack.description}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Tests" value={pack.item_count} />
                  <MiniStat label="Students" value={usage?.students_submitted ?? 0} />
                  <MiniStat label="Attempts" value={usage?.attempts ?? 0} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-black/45">
                  <span>{pack.visibility}</span>
                  <span>Avg {usage?.average_score ?? 0}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfbf6] px-3 py-3">
      <p className="text-base font-semibold">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">{label}</p>
    </div>
  );
}

function ImportTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FileJson; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold",
        active ? "border-[#276a5b] bg-[#151713] text-white" : "border-black/10 bg-white text-black/60 hover:bg-[#fbfbf6]",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <FieldShell label={label}>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} />
    </FieldShell>
  );
}
