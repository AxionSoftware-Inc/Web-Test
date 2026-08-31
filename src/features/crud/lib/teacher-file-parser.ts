import mammoth from "mammoth";
import ExcelJS from "exceljs";

import { parseTeacherContent, type TeacherImportResult } from "@/features/exam-packs/lib/teacher-import-parser";

function fileExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() || "";
}

function fileTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Yangi test";
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const cell = value as { text?: string; result?: unknown; richText?: Array<{ text?: string }> };
    if (cell.result !== undefined) return csvCell(cell.result);
    if (cell.richText) return cell.richText.map((item) => item.text || "").join("");
    if (cell.text) return cell.text;
  }
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function excelToCsv(file: File) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Excel faylida jadval topilmadi.");
  return worksheet.getSheetValues()
    .filter((row) => Array.isArray(row))
    .map((row) => (row as Array<unknown>).slice(1).map(csvCell).join(","))
    .join("\n");
}

/** Convert common teacher files into the same text format used by paste import. */
export async function parseTeacherFile(file: File, fallbackTopic: string): Promise<TeacherImportResult> {
  const extension = fileExtension(file.name);
  const fallbackTitle = fileTitle(file.name);

  if (extension === "xlsx" || extension === "xls") {
    const csv = await excelToCsv(file);
    return parseTeacherContent(csv, { fallbackTitle, fallbackTopic, format: "csv" });
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return parseTeacherContent(result.value, { fallbackTitle, fallbackTopic, format: "teacher-text" });
  }

  if (!["csv", "json", "txt", "md"].includes(extension)) {
    throw new Error("Bu fayl turi qo'llanmaydi. CSV, Excel, Word, JSON yoki TXT fayl tanlang.");
  }

  return parseTeacherContent(await file.text(), {
    fallbackTitle,
    fallbackTopic,
    format: extension === "csv" ? "csv" : extension === "json" ? "json" : "teacher-text",
  });
}
