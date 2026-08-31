import type { StrictPackImportSource } from "@/shared/api/questlab-api";
import {
  inferPackTitle,
  isRecord,
  normalizeDifficulty,
  normalizeQuestion,
  normalizeTest,
  parsePastedValue,
  readNumber,
  readQuestions,
  readString,
  slugify,
} from "./import-parser";
import type { ImportQuestion, ImportTest, LooseImportSource } from "./import-parser";

const optionIds = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");


export type TeacherImportResult = {
  source: StrictPackImportSource;
  warnings: string[];
  format: "teacher-text" | "csv" | "json";
};

type TeacherImportOptions = {
  fallbackTitle?: string;
  fallbackTopic?: string;
  format?: "teacher-text" | "csv" | "json";
};

function teacherSource(title: string, topic: string, questions: ImportQuestion[], difficulty: ImportTest["difficulty"] = "easy"): StrictPackImportSource {
  const cleanTitle = title.trim() || "Yangi test";
  const cleanTopic = topic.trim() || "general";
  return {
    version: "1.0",
    pack: {
      title: cleanTitle,
      subject: "general",
      branch: slugify(cleanTopic) || "general",
      level: difficulty,
      language: "uz",
    },
    tests: [{
      title: cleanTitle,
      topic: cleanTopic,
      difficulty,
      time_limit_minutes: 15,
      questions,
    }],
  };
}
function resolveTeacherAnswer(value: string, options: Array<{ id: string; text: string }>) {
  const answer = value.trim();
  if (!answer) return "";
  if (/^[a-h]$/i.test(answer)) return answer.toUpperCase();
  if (/^\d+$/.test(answer)) {
    const option = options[Number(answer) - 1];
    if (option) return option.id;
  }
  const option = options.find((item) => item.text.trim().toLowerCase() === answer.toLowerCase());
  return option?.id ?? answer;
}

export function parseTeacherText(text: string, fallbackTitle = "Yangi test", fallbackTopic = "general"): TeacherImportResult | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const questions: ImportQuestion[] = [];
  const warnings: string[] = [];
  let title = fallbackTitle;
  let topic = fallbackTopic;
  let current: { prompt: string[]; options: Array<{ id: string; text: string }>; answer: string; explanation: string[]; skills: string[] } | null = null;
  let readingExplanation = false;

  function flush() {
    if (!current) return;
    const body = current.prompt.join(" ").replace(/\s+/g, " ").trim();
    if (!body) {
      current = null;
      return;
    }
    const answer = resolveTeacherAnswer(current.answer, current.options);
    if (current.options.length && !answer) warnings.push(`${questions.length + 1}-savol: to'g'ri javob topilmadi.`);
    if (current.options.length === 1) warnings.push(`${questions.length + 1}-savol: kamida 2 ta variant kiriting.`);
    questions.push({
      type: current.options.length ? "single_choice" : "short_answer",
      body,
      options: current.options,
      answer: { correct: answer },
      explanation: current.explanation.join(" ").replace(/\s+/g, " ").trim(),
      skills: current.skills.length ? current.skills : ["general"],
      difficulty: "easy",
    });
    current = null;
    readingExplanation = false;
  }

  for (const line of lines) {
    if (!line) {
      if (current && readingExplanation) flush();
      continue;
    }
    const titleMatch = line.match(/^(?:test|nomi|title)\s*:\s*(.+)$/i);
    if (!current && titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }
    const topicMatch = line.match(/^(?:fan|bo['’]?lim|topic|subject|mavzu)\s*:\s*(.+)$/i);
    if (!current && topicMatch) {
      topic = topicMatch[1].trim();
      continue;
    }
    const questionMatch = line.match(/^(?:savol\s*)?(\d{1,3})[.)\-:]\s*(.*)$/i);
    if (questionMatch) {
      flush();
      current = { prompt: questionMatch[2] ? [questionMatch[2].trim()] : [], options: [], answer: "", explanation: [], skills: [] };
      continue;
    }
    const optionMatch = line.match(/^([a-h])\s*[).:\-]\s*(.+)$/i);
    if (optionMatch && current) {
      readingExplanation = false;
      current.options.push({ id: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() });
      continue;
    }
    const answerMatch = line.match(/^(?:javob|answer|correct|to['’]?g['’]?ri\s+javob)\s*:\s*(.+)$/i);
    if (answerMatch && current) {
      readingExplanation = false;
      current.answer = answerMatch[1].trim();
      continue;
    }
    const explanationMatch = line.match(/^(?:izoh|explanation|solution|yechim)\s*:\s*(.*)$/i);
    if (explanationMatch && current) {
      readingExplanation = true;
      if (explanationMatch[1].trim()) current.explanation.push(explanationMatch[1].trim());
      continue;
    }
    const skillsMatch = line.match(/^(?:skill|skills|ko['’]?nikma|tag)\s*:\s*(.+)$/i);
    if (skillsMatch && current) {
      current.skills = skillsMatch[1].split(/[|,;]/).map((item) => item.trim()).filter(Boolean);
      continue;
    }
    if (!current) {
      title = title === fallbackTitle ? line : title;
      continue;
    }
    if (readingExplanation) current.explanation.push(line);
    else current.prompt.push(line);
  }
  flush();
  if (!questions.length) return null;
  return { source: teacherSource(title, topic, questions), warnings, format: "teacher-text" };
}

function parseDelimitedLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function csvKey(value: string) {
  return value.toLowerCase().replace(/[\s_'’-]+/g, "").replace(/[^a-z0-9]/g, "");
}

export function parseTeacherCsv(text: string, fallbackTitle = "Yangi test", fallbackTopic = "general"): TeacherImportResult | null {
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(parseDelimitedLine);
  if (!rows.length) return null;
  const knownKeys = new Set(["question", "savol", "prompt", "text", "answer", "javob", "correct", "explanation", "izoh"]);
  const headerKeys = rows[0].map(csvKey);
  const hasHeader = headerKeys.some((key) => knownKeys.has(key) || /^[a-h]$/.test(key));
  const headers = hasHeader ? headerKeys : ["question", "a", "b", "c", "d", "answer", "explanation", "skills"];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const warnings: string[] = [];
  const questions: ImportQuestion[] = [];
  const valueFor = (row: string[], aliases: string[]) => {
    const index = headers.findIndex((header) => aliases.includes(header));
    return index >= 0 ? row[index]?.trim() ?? "" : "";
  };
  dataRows.forEach((row, index) => {
    const body = valueFor(row, ["question", "savol", "prompt", "text"]);
    if (!body) {
      warnings.push(`${index + 1}-qator: savol matni yo'q.`);
      return;
    }
    const options = headers
      .map((header, cellIndex) => ({ header, text: row[cellIndex]?.trim() ?? "" }))
      .filter((item) => /^[a-h]$/.test(item.header) && item.text)
      .map((item) => ({ id: item.header.toUpperCase(), text: item.text }));
    const packedOptions = valueFor(row, ["options", "variantlar"]).split(/[|;]/).map((item) => item.trim()).filter(Boolean);
    const allOptions = options.length ? options : packedOptions.map((item, optionIndex) => ({ id: optionIds[optionIndex] ?? String(optionIndex + 1), text: item }));
    const answer = resolveTeacherAnswer(valueFor(row, ["answer", "javob", "correct", "correctanswer"]), allOptions);
    if (allOptions.length && !answer) warnings.push(`${index + 1}-qator: javob yo'q.`);
    questions.push({
      type: allOptions.length ? "single_choice" : "short_answer",
      body,
      options: allOptions,
      answer: { correct: answer },
      explanation: valueFor(row, ["explanation", "izoh", "solution"]),
      skills: valueFor(row, ["skills", "skill", "tags"]).split(/[|;]/).map((item) => item.trim()).filter(Boolean),
      difficulty: "easy",
    });
  });
  if (!questions.length) return null;
  return { source: teacherSource(fallbackTitle, fallbackTopic, questions), warnings, format: "csv" };
}

export function normalizeImportSource(raw: unknown, options: { title?: string; examType?: string } = {}): StrictPackImportSource | null {
  const title = options.title?.trim() || "Imported pack";
  const examType = options.examType?.trim() || "general";
  const fallbackPack = {
    title: inferPackTitle(raw, title),
    subject: examType.toLowerCase().includes("math") ? "math" : slugify(examType || "general"),
    branch: slugify(examType || title || "general"),
    level: "mixed",
    language: "uz",
  };
  if (Array.isArray(raw)) {
    const tests = raw.map((item, index) => normalizeTest(item, `${title} ${index + 1}`, fallbackPack.branch)).filter((item): item is ImportTest => Boolean(item));
    if (tests.length) return { version: "1.0", pack: fallbackPack, tests };
    const questions = raw.map((item) => normalizeQuestion(item, "easy")).filter((item): item is ImportQuestion => Boolean(item));
    return questions.length ? { version: "1.0", pack: fallbackPack, tests: [{ title, topic: fallbackPack.branch, difficulty: "easy", time_limit_minutes: 15, questions }] } : null;
  }
  if (!isRecord(raw)) return null;
  const source = raw as LooseImportSource;
  const sourceRecord = raw as Record<string, unknown>;
  const packRecord = isRecord(source.pack) ? source.pack : isRecord(source.examPack) ? source.examPack : isRecord(source.exam_pack) ? source.exam_pack : isRecord(source.packInfo) ? source.packInfo : sourceRecord;
  const pack = {
    title: readString(packRecord, ["title", "name", "nom"], fallbackPack.title),
    subject: readString(packRecord, ["subject", "subject_slug"], fallbackPack.subject),
    branch: readString(packRecord, ["branch", "category", "topic", "exam_type", "bolim", "bo'lim"], fallbackPack.branch),
    level: readString(packRecord, ["level", "difficulty"], fallbackPack.level),
    language: readString(packRecord, ["language", "lang"], fallbackPack.language),
  };
  const sourceTests = Array.isArray(source.tests) ? source.tests : Array.isArray(source.testlar) ? source.testlar : [];
  if (sourceTests.length) {
    const tests = sourceTests.map((item, index) => normalizeTest(item, `${pack.title} ${index + 1}`, pack.branch)).filter((item): item is ImportTest => Boolean(item));
    if (tests.length) return { version: "1.0", pack, tests };
    const questions = sourceTests.map((item) => normalizeQuestion(item, normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "easy")))).filter((item): item is ImportQuestion => Boolean(item));
    if (questions.length) return { version: "1.0", pack, tests: [{ title: readString(sourceRecord, ["title", "name"], pack.title), topic: pack.branch, difficulty: normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "easy")), time_limit_minutes: 15, questions }] };
  }
  if (source.test) {
    const test = normalizeTest(source.test, pack.title, pack.branch);
    if (test) return { version: "1.0", pack, tests: [test] };
  }
  const directQuestions = readQuestions(sourceRecord).map((question) => normalizeQuestion(question, normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "easy")))).filter((item): item is ImportQuestion => Boolean(item));
  if (directQuestions.length) return { version: "1.0", pack, tests: [{ title: readString(sourceRecord, ["title", "name"], pack.title), topic: readString(sourceRecord, ["topic", "category", "branch"], pack.branch), difficulty: normalizeDifficulty(readString(sourceRecord, ["difficulty", "level"], "easy")), time_limit_minutes: readNumber(sourceRecord, ["time_limit_minutes", "estimated_minutes", "estimatedMinutes", "minutes", "duration"], 15), questions: directQuestions }] };
  if (Array.isArray(source.items)) {
    const tests = source.items.map((item, index) => normalizeTest(isRecord(item) && isRecord(item.test) ? item.test : item, `${pack.title} ${index + 1}`, pack.branch)).filter((item): item is ImportTest => Boolean(item));
    if (tests.length) return { version: "1.0", pack, tests };
  }
  return null;
}

export function parseTeacherContent(text: string, options: TeacherImportOptions = {}): TeacherImportResult {
  const fallbackTitle = options.fallbackTitle || "Yangi test";
  const fallbackTopic = options.fallbackTopic || "general";
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Matn bo'sh. Savollarni joylang yoki fayl tanlang.");
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[") || /^```\s*json/i.test(trimmed);
  if (options.format === "csv" || (!looksJson && /(?:^|,)(?:question|savol|prompt)(?:,|$)/im.test(trimmed.split(/\r?\n/, 1)[0]))) {
    const result = parseTeacherCsv(trimmed, fallbackTitle, fallbackTopic);
    if (!result) throw new Error("CSV ichidan savollar topilmadi.");
    return result;
  }
  if (looksJson) {
    const source = normalizeImportSource(parsePastedValue(trimmed), { title: fallbackTitle, examType: fallbackTopic });
    if (!source) throw new Error("JSON ichidan savollar topilmadi.");
    return { source, warnings: [], format: "json" };
  }
  const result = parseTeacherText(trimmed, fallbackTitle, fallbackTopic);
  if (!result) throw new Error("Matndan savol topilmadi. Namuna formatidan foydalaning.");
  return result;
}
