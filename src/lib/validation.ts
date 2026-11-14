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

export function validateTempPatientCreateInput(input: {
  label: string;
  gender: "Female" | "Male";
  age: number;
  notes: string;
}) {
  const label = sanitizeText(input.label, 120);
  if (label.length < 2) {
    throw new ValidationError(
      "Temporary file label must be between 2 and 120 characters."
    );
  }
  if (input.gender !== "Female" && input.gender !== "Male") {
    throw new ValidationError("Gender must be 'Female' or 'Male'.");
  }
  const age = Number(input.age);
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    throw new ValidationError("Age must be a valid number between 0 and 120.");
  }
  const notes = sanitizeText(input.notes, 2000);
  if (!notes) {
    throw new ValidationError("Medical notes are required.");
  }
  return { label, gender: input.gender, age: Math.round(age), notes };
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

