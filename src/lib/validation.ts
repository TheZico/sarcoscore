// src/lib/validation.ts
import { isValidNationalId } from "./rls";

export class ValidationError extends Error {
  public readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Strips HTML tags, script payloads, and control characters from text inputs.
 */
export function sanitizeText(raw: string, maxLength = 500): string {
  if (typeof raw !== "string") {
    throw new ValidationError("Expected a text value.");
  }
  const cleaned = raw
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
  if (cleaned.length > maxLength) {
    throw new ValidationError(
      `Input exceeds maximum allowed length of ${maxLength} characters.`
    );
  }
  return cleaned;
}

export function validatePatientCreateInput(input: {
  fullName: string;
  nationalId: string;
  gender: "Female" | "Male";
  dob: string;
  phone: string;
  historySummary: string;
}) {
  const fullName = sanitizeText(input.fullName, 120);
  if (fullName.length < 2) {
    throw new ValidationError("Full name must be between 2 and 120 characters.");
  }

  const nationalId = String(input.nationalId ?? "").trim();
  if (!isValidNationalId(nationalId)) {
    throw new ValidationError(
      "Egyptian National ID must be exactly 14 numeric digits."
    );
  }

  if (input.gender !== "Female" && input.gender !== "Male") {
    throw new ValidationError("Gender must be 'Female' or 'Male'.");
  }

  const dob = String(input.dob ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    throw new ValidationError("Date of birth must be in YYYY-MM-DD format.");
  }
  const dobTime = Date.parse(dob);
  if (Number.isNaN(dobTime) || dobTime > Date.now()) {
    throw new ValidationError("Date of birth cannot be in the future.");
  }

  const phone = sanitizeText(input.phone, 30);
  if (!/^[0-9+\-\s()]{6,30}$/.test(phone)) {
    throw new ValidationError("Invalid phone number format.");
  }

  const historySummary = sanitizeText(input.historySummary, 2000);
  if (!historySummary) {
    throw new ValidationError("Medical history summary is required.");
  }

  return { fullName, nationalId, gender: input.gender, dob, phone, historySummary };
}

/**
 * Neutralizes spreadsheet/CSV formula injection (values starting with =, +, -, or @)
 * so Excel/CSV never executes cell values as formulas. Instead they are stored as plain text.
 */
export function neutralizeFormulaInjection(raw: string): string {
  const trimmed = raw.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export function validateManualResearchCaseInput(input: {
  caseCode: string;
  age: number | string;
  diagnosticTimeMonths: number | string;
  confirmedDisease: string;
  gender?: "Female" | "Male";
  symptoms: string[];
  testValues: Record<string, string | number | undefined> | string;
}) {
  const caseCode = neutralizeFormulaInjection(
    sanitizeText(String(input.caseCode ?? ""), 40)
  );
  if (caseCode.length < 2) {
    throw new ValidationError(
      "Case number is required (2 to 40 characters)."
    );
  }

  const age = Number(input.age);
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    throw new ValidationError("Age must be a valid number between 0 and 120.");
  }

  const diagnosticTimeMonths = Number(input.diagnosticTimeMonths);
  if (
    !Number.isFinite(diagnosticTimeMonths) ||
    diagnosticTimeMonths < 0 ||
    diagnosticTimeMonths > 600
  ) {
    throw new ValidationError(
      "Diagnostic time (months) must be a valid number between 0 and 600."
    );
  }

  const confirmedDisease = neutralizeFormulaInjection(
    sanitizeText(String(input.confirmedDisease ?? ""), 160)
  );
  if (confirmedDisease.length < 2) {
    throw new ValidationError("Final confirmed disease is required.");
  }

  if (!Array.isArray(input.symptoms)) {
    throw new ValidationError("Symptoms must be a list of finding codes.");
  }
  const symptoms = Array.from(
    new Set(
      input.symptoms
        .map((s) => sanitizeText(String(s), 80))
        .filter((s) => s.length > 0)
    )
  );

  const normalizedTests: Record<string, string> = {};
  const summaryParts: string[] = [];

  if (typeof input.testValues === "string") {
    const cleaned = neutralizeFormulaInjection(
      sanitizeText(input.testValues, 1000)
    );
    if (cleaned) {
      normalizedTests["summary"] = cleaned;
      summaryParts.push(cleaned);
    }
  } else if (input.testValues && typeof input.testValues === "object") {
    for (const [k, rawVal] of Object.entries(input.testValues)) {
      if (rawVal === undefined || rawVal === null) continue;
      const key = neutralizeFormulaInjection(sanitizeText(String(k), 80));
      const val = neutralizeFormulaInjection(sanitizeText(String(rawVal), 200));
      if (key && val) {
        normalizedTests[key] = val;
        summaryParts.push(`${key}: ${val}`);
      }
    }
  }

  const investigationsSummary =
    summaryParts.length > 0 ? summaryParts.join(", ") : "Manual entry";

  return {
    caseCode,
    age: Math.round(age),
    diagnosticTimeMonths: Math.round(diagnosticTimeMonths),
    confirmedDisease,
    gender: input.gender === "Male" ? ("Male" as const) : ("Female" as const),
    symptoms,
    testValues: normalizedTests,
    investigationsSummary,
  };
}

export function validateSymptomPointsOverride(rawPoints: unknown): number {
  if (rawPoints === "" || rawPoints === null || rawPoints === undefined) {
    throw new ValidationError(
      "Symptom points must be a whole number between -2 and 5."
    );
  }
  const num = Number(rawPoints);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < -2 || num > 5) {
    throw new ValidationError(
      "Symptom points must be a whole number between -2 and 5."
    );
  }
  return num;
}

export function validateLabRangeOverride(input: {
  low: unknown;
  high: unknown;
  max_points: unknown;
}): { low: number; high: number; max_points: number } {
  if (
    input.low === "" ||
    input.low === null ||
    input.low === undefined ||
    input.high === "" ||
    input.high === null ||
    input.high === undefined
  ) {
    throw new ValidationError(
      "Lab normal low and normal high must be valid numbers with low less than high."
    );
  }
  const low = Number(input.low);
  const high = Number(input.high);
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    throw new ValidationError(
      "Lab normal low and normal high must be valid numbers."
    );
  }
  if (low < 0) {
    throw new ValidationError("Lab normal low cannot be negative.");
  }
  if (low >= high) {
    throw new ValidationError("Lab normal low must be less than normal high.");
  }

  if (
    input.max_points === "" ||
    input.max_points === null ||
    input.max_points === undefined
  ) {
    throw new ValidationError(
      "Lab max points must be a whole number of 0 or more."
    );
  }
  const maxPoints = Number(input.max_points);
  if (
    !Number.isFinite(maxPoints) ||
    !Number.isInteger(maxPoints) ||
    maxPoints < 0
  ) {
    throw new ValidationError(
      "Lab max points must be a whole number of 0 or more."
    );
  }

  return { low, high, max_points: maxPoints };
}

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates research upload file metadata and magic bytes (if provided).
 */
export function validateResearchUploadFile(params: {
  fileName: string;
  fileSize?: number;
  headerBytes?: Uint8Array;
}): { sanitizedFileName: string; detectedType: "Excel" | "PDF" } {
  const sanitizedFileName = sanitizeText(params.fileName, 180).replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
  const lower = sanitizedFileName.toLowerCase();

  if (
    params.fileSize !== undefined &&
    (params.fileSize <= 0 || params.fileSize > MAX_UPLOAD_SIZE_BYTES)
  ) {
    throw new ValidationError(
      "Uploaded file size must be between 1 byte and 5 MB."
    );
  }

  const isPdfExt = lower.endsWith(".pdf");
  const isExcelExt =
    lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv");

  if (!isPdfExt && !isExcelExt) {
    throw new ValidationError(
      "Only Excel (.xlsx, .xls, .csv) and PDF (.pdf) files are allowed."
    );
  }

  if (params.headerBytes && params.headerBytes.length >= 4) {
    const b = params.headerBytes;
    if (isPdfExt) {
      // %PDF magic bytes: 0x25 0x50 0x44 0x46
      const isPdfMagic =
        b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
      if (!isPdfMagic) {
        throw new ValidationError(
          "File signature does not match a valid PDF document (%PDF)."
        );
      }
    } else if (lower.endsWith(".xlsx")) {
      // ZIP/OOXML magic bytes: PK\x03\x04 (0x50 0x4B 0x03 0x04)
      const isZipMagic =
        b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
      if (!isZipMagic) {
        throw new ValidationError(
          "File signature does not match a valid .xlsx workbook."
        );
      }
    }
  }

  return {
    sanitizedFileName,
    detectedType: isPdfExt ? "PDF" : "Excel",
  };
}

