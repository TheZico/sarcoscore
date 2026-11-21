import {
  DEMO_USERS,
  SEED_PATIENTS,
  SEED_VISITS,
  SEED_MEDICAL_LISTS,
  SEED_LAB_RANGES,
  SEED_IMPORTED_CASES,
  SEED_PATIENT_RESULTS,
  SEED_AUDIT_LOG,
  DemoUserAccount,
  PatientRecord,
  VisitRecord,
  MedicalListItem,
  LabRangeItem,
  ImportedCaseRecord,
  PatientHealthResult,
  AuditLogEntry,
} from "@/data/seed";
import {
  SessionUser,
  UserRole,
  AppFeature,
  RLSViolationError,
  assertFeatureAccess,
  assertPatientOwnRecord,
} from "@/lib/rls";
import {
  ValidationError,
  sanitizeText,
  neutralizeFormulaInjection,
  validatePatientCreateInput,
  validateManualResearchCaseInput,
  validateResearchUploadFile,
} from "@/lib/validation";
import { checkRateLimit, resetRateLimiter } from "@/lib/security";
import { score } from "@/lib/scoring";
import model from "@/data/model.json";

export interface DatabaseState {
  users: DemoUserAccount[];
  patients: PatientRecord[];
  visits: VisitRecord[];
  medicalLists: MedicalListItem[];
  labRanges: LabRangeItem[];
  importedCases: ImportedCaseRecord[];
  patientResults: PatientHealthResult[];
  auditLog: AuditLogEntry[];
}

function cloneInitialState(): DatabaseState {
  return JSON.parse(
    JSON.stringify({
      users: DEMO_USERS,
      patients: SEED_PATIENTS,
      visits: SEED_VISITS,
      medicalLists: SEED_MEDICAL_LISTS,
      labRanges: SEED_LAB_RANGES,
      importedCases: SEED_IMPORTED_CASES,
      patientResults: SEED_PATIENT_RESULTS,
      auditLog: SEED_AUDIT_LOG,
    })
  );
}

const NON_PII_STORAGE_KEY = "sarcoscore_deidentified_state_v1";

// Keep clinical patient records strictly in memory so National IDs and patient names
// are never persisted in browser localStorage/sessionStorage.
// De-identified research uploads (importedCases), medicalLists, labRanges, visits, and auditLog
// contain zero National IDs or patient names and are persisted so uploads survive page reloads.
let memoryState: DatabaseState | null = null;

function purgeLegacyBrowserStorage(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("sarcoscore_db_v1");
      window.localStorage.removeItem("sarcoscore_db_v2");
      window.localStorage.removeItem("sarcoscore_session_user_v1");
    } catch {
      // ignore storage errors
    }
  }
}

export function loadDb(): DatabaseState {
  purgeLegacyBrowserStorage();
  if (!memoryState) {
    memoryState = cloneInitialState();
    if (typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem(NON_PII_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.importedCases)) {
            memoryState.importedCases = parsed.importedCases;
          }
          if (Array.isArray(parsed.medicalLists)) {
            memoryState.medicalLists = parsed.medicalLists;
          }
          if (Array.isArray(parsed.labRanges)) {
            memoryState.labRanges = parsed.labRanges;
          }
          if (Array.isArray(parsed.visits)) {
            memoryState.visits = parsed.visits;
          }
          if (Array.isArray(parsed.auditLog)) {
            memoryState.auditLog = parsed.auditLog;
          }
        }
      } catch {
        // ignore storage parse errors
      }
    }
  }
  return memoryState;
}

export function saveDb(next: DatabaseState): void {
  memoryState = next;
  if (typeof window !== "undefined") {
    try {
      // Persist only de-identified tables (never patients or National IDs)
      window.sessionStorage.setItem(
        NON_PII_STORAGE_KEY,
        JSON.stringify({
          importedCases: next.importedCases,
          medicalLists: next.medicalLists,
          labRanges: next.labRanges,
          visits: next.visits,
          auditLog: next.auditLog,
        })
      );
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(new Event("sarcoscore-db-updated"));
  }
}

export function resetDbToSeed(): DatabaseState {
  resetRateLimiter();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(NON_PII_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  const fresh = cloneInitialState();
  saveDb(fresh);
  return fresh;
}

function appendAudit(
  db: DatabaseState,
  user: SessionUser,
  action: string,
  target: string
) {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action,
    target,
    at: new Date().toISOString(),
  };
  db.auditLog = [entry, ...db.auditLog].slice(0, 200);
}

/**
 * Resolves the authoritative user record from the server database and verifies
 * that the caller's role has not been spoofed on the client.
 */
function verifyServerAccess(
  user: SessionUser | null | undefined,
  feature: AppFeature
): SessionUser {
  if (!user) {
    throw new RLSViolationError(
      `RLS denied: unauthenticated access to "${feature}".`
    );
  }
  const db = loadDb();
  const account = db.users.find((u) => u.id === user.id);
  if (!account || account.role !== user.role) {
    throw new RLSViolationError(
      `RLS denied: invalid or tampered session role for "${feature}".`
    );
  }
  const authoritativeUser: SessionUser = {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    linkedPatientId: account.linkedPatientId,
  };
  return assertFeatureAccess(authoritativeUser, feature);
}

// ============================================================================
// 1. AUTHENTICATION & SESSION (WITH RATE LIMITING)
// ============================================================================

export function authenticateWithEmailPassword(
  email: string,
  password: string
): SessionUser {
  const db = loadDb();
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized || !password) {
    throw new ValidationError("Email and password are required.");
  }

  const account = db.users.find(
    (u) =>
      (u.email.toLowerCase() === normalized ||
        u.fullName.toLowerCase() === normalized) &&
      u.password === password
  );

  if (!account) {
    // Rate limit failed login attempts per identifier (max 5 failed attempts / minute)
    checkRateLimit("login", normalized, 5, 60_000);
    throw new Error("Invalid email or password.");
  }

  const sessionUser: SessionUser = {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    linkedPatientId: account.linkedPatientId,
  };
  appendAudit(db, sessionUser, "USER_LOGIN", `Signed in as ${account.role}`);
  saveDb(db);
  return sessionUser;
}

// ============================================================================
// 2. DASHBOARD, CREATE & REVIEW, PATIENT PROFILE (Doctor & Admin only via RLS)
// ============================================================================

export function listPatientsForDashboard(
  user: SessionUser | null
): PatientRecord[] {
  verifyServerAccess(user, "dashboard");
  const db = loadDb();
  return [...db.patients].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getPatientRecordById(
  user: SessionUser | null,
  patientId: string
): PatientRecord | undefined {
  verifyServerAccess(user, "patient_profile");
  const db = loadDb();
  return db.patients.find((p) => p.id === patientId);
}

export function recordPatientFileOpened(
  user: SessionUser | null,
  id: string
): void {
  const verified = verifyServerAccess(user, "patient_profile");
  const db = loadDb();
  const now = new Date().toISOString();
  const pat = db.patients.find((p) => p.id === id);
  if (pat) {
    pat.lastOpenedAt = now;
    appendAudit(db, verified, "OPEN_PATIENT_FILE", `Opened ${pat.patientCode}`);
    saveDb(db);
  }
}

export function listVisitsForPatient(
  user: SessionUser | null,
  patientId: string
): VisitRecord[] {
  verifyServerAccess(user, "patient_profile");
  const db = loadDb();
  return db.visits
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function listAllVisitsForClinical(
  user: SessionUser | null
): VisitRecord[] {
  verifyServerAccess(user, "dashboard");
  const db = loadDb();
  return [...db.visits].sort((a, b) => b.date.localeCompare(a.date));
}

export function createPatientFile(
  user: SessionUser | null,
  input: {
    fullName: string;
    nationalId: string;
    gender: "Female" | "Male";
    dob: string;
    phone: string;
    historySummary: string;
  }
): PatientRecord {
  const verified = verifyServerAccess(user, "create_review");
  const clean = validatePatientCreateInput(input);
  const db = loadDb();
  if (db.patients.some((p) => p.nationalId === clean.nationalId)) {
    throw new ValidationError(
      "A patient file with this 14-digit National ID already exists."
    );
  }
  const nextNum = db.patients.length + 1;
  const now = new Date().toISOString();
  const record: PatientRecord = {
    id: `pat-${1000 + nextNum}-${Date.now().toString(36).slice(-3)}`,
    patientCode: `PT-2026-${String(nextNum).padStart(3, "0")}`,
    nationalId: clean.nationalId,
    fullName: clean.fullName,
    gender: clean.gender,
    dob: clean.dob,
    phone: clean.phone,
    historySummary: clean.historySummary,
    recordedDiagnosis: "Under evaluation (biopsy pending)",
    createdBy: verified.id,
    lastOpenedAt: now,
    createdAt: now,
  };
  db.patients = [record, ...db.patients];
  // Never log patient fullName or nationalId to audit_log
  appendAudit(
    db,
    verified,
    "CREATE_PATIENT_FILE",
    `Created patient ${record.patientCode} (id: ${record.id})`
  );
  saveDb(db);
  return record;
}

export function updatePatientPersonalAndDiagnosis(
  user: SessionUser | null,
  patientId: string,
  updates: Partial<
    Pick<
      PatientRecord,
      | "fullName"
      | "gender"
      | "dob"
      | "phone"
      | "historySummary"
      | "recordedDiagnosis"
    >
  >
): PatientRecord {
  const verified = verifyServerAccess(user, "patient_profile");
  const db = loadDb();
  const pat = db.patients.find((p) => p.id === patientId);
  if (!pat) {
    throw new Error("Patient record not found.");
  }
  if (updates.fullName !== undefined) {
    pat.fullName = sanitizeText(updates.fullName, 120);
  }
  if (updates.gender === "Female" || updates.gender === "Male") {
    pat.gender = updates.gender;
  }
  if (updates.dob !== undefined) {
    pat.dob = sanitizeText(updates.dob, 20);
  }
  if (updates.phone !== undefined) {
    pat.phone = sanitizeText(updates.phone, 30);
  }
  if (updates.historySummary !== undefined) {
    pat.historySummary = sanitizeText(updates.historySummary, 2000);
  }
  if (updates.recordedDiagnosis !== undefined) {
    pat.recordedDiagnosis = sanitizeText(updates.recordedDiagnosis, 300);
  }
  appendAudit(
    db,
    verified,
    "UPDATE_PATIENT_PROFILE",
    `Updated profile/diagnosis for ${pat.patientCode}`
  );
  saveDb(db);
  return pat;
}

export function addClinicalVisit(
  user: SessionUser | null,
  input: {
    patientId: string;
    symptoms: string[];
    labs: Record<string, number | undefined>;
    investigations: string[];
    clinicalNotes: string;
  }
): VisitRecord {
  const verified = verifyServerAccess(user, "patient_profile");
  if (!input.patientId) {
    throw new ValidationError("Patient ID is required to save a clinical visit.");
  }
  const db = loadDb();
  const evalResult = score(
    { symptoms: input.symptoms, labs: input.labs },
    {
      customFeatures: db.medicalLists
        .filter((m) => m.category === "symptom")
        .map((m) => ({
          id: m.code,
          label: m.name,
          points: m.points ?? 0,
        })),
      customLabs: db.labRanges,
    }
  );
  const visit: VisitRecord = {
    id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    patientId: input.patientId,
    doctorId: verified.id,
    doctorName: verified.fullName,
    date: new Date().toISOString(),
    symptoms: Array.from(new Set(input.symptoms)),
    labs: input.labs,
    investigations: input.investigations.map((x) => sanitizeText(x, 120)),
    clinicalNotes: sanitizeText(input.clinicalNotes || "", 2000),
    total: evalResult.total,
    probability: evalResult.probability,
    level: evalResult.level,
    modelVersion: model.version,
  };
  db.visits = [...db.visits, visit];
  appendAudit(
    db,
    verified,
    "ADD_CLINICAL_VISIT",
    `Saved visit on ${input.patientId}: ${Math.round(visit.probability * 100)}% (${visit.level}, ${visit.total} pts, v${visit.modelVersion})`
  );
  saveDb(db);
  return visit;
}

// ============================================================================
// 3. RESEARCH & INSIGHTS (Researcher & Admin only via RLS + Rate Limiting)
// ============================================================================

export function listImportedCases(
  user: SessionUser | null
): ImportedCaseRecord[] {
  verifyServerAccess(user, "research_insights");
  const db = loadDb();
  return [...db.importedCases].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

/**
 * Option 1: Add new case by uploading an Excel or PDF file.
 * Validates file size (<= 5 MB), file extension (.xlsx, .xls, .csv, .pdf), and magic bytes.
 * Never executes content and saves with status "pending".
 */
export function submitImportedResearchCase(
  user: SessionUser | null,
  input: {
    fileName: string;
    fileType?: "Excel" | "PDF";
    fileSize?: number;
    fileSizeBytes?: number;
    headerBytes?: Uint8Array;
    magicBytes?: Uint8Array;
    caseCode?: string;
    age?: number;
    gender?: "Female" | "Male";
    source?: string;
    symptoms?: string[];
    investigations?: string;
    confirmedDisease?: string;
    diagnosticTimeMonths?: number;
  }
): ImportedCaseRecord {
  const verified = verifyServerAccess(user, "research_insights");
  checkRateLimit("upload", verified.id, 10, 60_000);

  const validatedFile = validateResearchUploadFile({
    fileName: input.fileName,
    fileSize: input.fileSize ?? input.fileSizeBytes,
    headerBytes: input.headerBytes ?? input.magicBytes,
  });

  const db = loadDb();
  const nextIdx = db.importedCases.length + 31;
  const age = input.age !== undefined ? Number(input.age) : 45;
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    throw new ValidationError("Case age must be between 0 and 120.");
  }

  const record: ImportedCaseRecord = {
    id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    uploadedBy: verified.id,
    uploadedByEmail: verified.email,
    entryMethod: "upload",
    fileName: validatedFile.sanitizedFileName,
    fileType: validatedFile.detectedType,
    caseSummary: {
      caseCode: neutralizeFormulaInjection(
        sanitizeText(input.caseCode || `LIT-2026-${nextIdx}`, 40)
      ),
      age: Math.round(age),
      gender: input.gender === "Male" ? "Male" : "Female",
      source: neutralizeFormulaInjection(
        sanitizeText(
          input.source || `${validatedFile.detectedType} File Upload`,
          120
        )
      ),
      symptoms: Array.from(new Set(input.symptoms ?? [])),
      investigations: neutralizeFormulaInjection(
        sanitizeText(
          input.investigations ||
            `Uploaded file (${validatedFile.sanitizedFileName})`,
          500
        )
      ),
      confirmedDisease: neutralizeFormulaInjection(
        sanitizeText(
          input.confirmedDisease || "Sarcoidosis (File Import)",
          160
        )
      ),
      diagnosticTimeMonths: Math.max(
        0,
        Math.round(Number(input.diagnosticTimeMonths ?? 6) || 0)
      ),
    },
    status: "pending", // Always pending review; never alters live model automatically
    createdAt: new Date().toISOString(),
  };
  db.importedCases = [record, ...db.importedCases];
  appendAudit(
    db,
    verified,
    "IMPORT_CASE_PENDING",
    `Uploaded ${record.fileName} (${record.fileType}) -> status: pending`
  );
  saveDb(db);
  return record;
}

/**
 * Option 2: Add new case by entering case fields manually (no file upload required).
 * Validated on the server via validateManualResearchCaseInput.
 * Saves with status "pending" and never alters live scoring automatically.
 */
export function submitManualResearchCase(
  user: SessionUser | null,
  input: {
    caseCode: string;
    age: number | string;
    diagnosticTimeMonths: number | string;
    confirmedDisease: string;
    gender?: "Female" | "Male";
    symptoms: string[];
    testValues: Record<string, string | number | undefined> | string;
  }
): ImportedCaseRecord {
  const verified = verifyServerAccess(user, "research_insights");
  checkRateLimit("upload", verified.id, 10, 60_000);

  const clean = validateManualResearchCaseInput(input);
  const db = loadDb();

  const record: ImportedCaseRecord = {
    id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    uploadedBy: verified.id,
    uploadedByEmail: verified.email,
    entryMethod: "manual",
    fileName: `Manual Entry (${clean.caseCode})`,
    fileType: "Manual",
    caseSummary: {
      caseCode: clean.caseCode,
      age: clean.age,
      gender: clean.gender,
      source: "Manual Case Entry",
      symptoms: clean.symptoms,
      investigations: clean.investigationsSummary,
      testValues: clean.testValues,
      confirmedDisease: clean.confirmedDisease,
      diagnosticTimeMonths: clean.diagnosticTimeMonths,
    },
    status: "pending", // Always pending review; never alters live model automatically
    createdAt: new Date().toISOString(),
  };
  db.importedCases = [record, ...db.importedCases];
  appendAudit(
    db,
    verified,
    "MANUAL_CASE_PENDING",
    `Entered manual research case ${clean.caseCode} -> status: pending`
  );
  saveDb(db);
  return record;
}

/**
 * Only an Admin or Researcher approval moves a pending case forward.
 */
export function updateImportedCaseStatus(
  user: SessionUser | null,
  importId: string,
  status: "pending" | "approved" | "rejected"
): ImportedCaseRecord {
  const verified = verifyServerAccess(user, "research_insights");
  const db = loadDb();
  const target = db.importedCases.find((c) => c.id === importId);
  if (!target) throw new Error("Imported case not found.");
  target.status = status;
  appendAudit(
    db,
    verified,
    "REVIEW_IMPORTED_CASE",
    `Marked imported case ${target.caseSummary.caseCode} (${target.fileName}) as ${status}`
  );
  saveDb(db);
  return target;
}

export interface DeidentifiedResearchCase {
  id: string;
  caseCode: string;
  source: "Published Cohort" | "Clinic Visit" | "Pending Import";
  age: number;
  gender: "Female" | "Male";
  symptoms: string[];
  investigations: string[];
  diagnosis: string;
  scorePct: number;
  level: string;
}

export function listResearchPatientCases(
  user: SessionUser | null
): DeidentifiedResearchCase[] {
  verifyServerAccess(user, "research_insights");
  const db = loadDb();
  const results: DeidentifiedResearchCase[] = [];

  for (const pat of db.patients) {
    const visits = db.visits
      .filter((v) => v.patientId === pat.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const latest = visits[0];
    const birthYear = Number(pat.dob.slice(0, 4)) || 1980;
    results.push({
      id: pat.id,
      caseCode: pat.patientCode,
      source: "Clinic Visit",
      age: 2026 - birthYear,
      gender: pat.gender,
      symptoms: latest?.symptoms ?? [],
      investigations: latest?.investigations ?? [],
      diagnosis: pat.recordedDiagnosis,
      scorePct: latest ? Math.round(latest.probability * 100) : 10,
      level: latest?.level ?? "Low",
    });
  }

  for (const imp of db.importedCases) {
    const s = score({ symptoms: imp.caseSummary.symptoms, labs: {} });
    results.push({
      id: imp.id,
      caseCode: imp.caseSummary.caseCode,
      source: "Pending Import",
      age: imp.caseSummary.age,
      gender: imp.caseSummary.gender,
      symptoms: imp.caseSummary.symptoms,
      investigations: imp.caseSummary.investigations
        .split(",")
        .map((x) => x.trim()),
      diagnosis: `${imp.caseSummary.confirmedDisease} (${imp.status})`,
      scorePct: Math.round(s.probability * 100),
      level: s.level,
    });
  }

  return results;
}

// ============================================================================
// 4. SYSTEM MANAGEMENT (Admin only via RLS)
// ============================================================================

export function listUserAccounts(
  user: SessionUser | null
): Omit<DemoUserAccount, "password">[] {
  verifyServerAccess(user, "system_management");
  const db = loadDb();
  return db.users.map(({ password: _pw, ...rest }) => rest);
}

export function createUserAccount(
  user: SessionUser | null,
  input: {
    email: string;
    fullName: string;
    role: UserRole;
    password?: string;
  }
): Omit<DemoUserAccount, "password"> {
  const verified = verifyServerAccess(user, "system_management");
  const db = loadDb();
  const normalized = sanitizeText(input.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new ValidationError("Invalid email address format.");
  }
  if (db.users.some((u) => u.email.toLowerCase() === normalized)) {
    throw new ValidationError("An account with this email already exists.");
  }
  const password = (input.password ?? "demo1234").trim();
  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }
  const created: DemoUserAccount = {
    id: `usr-${Date.now()}`,
    email: normalized,
    password,
    fullName: sanitizeText(input.fullName, 120),
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  db.users = [...db.users, created];
  appendAudit(
    db,
    verified,
    "CREATE_USER_ACCOUNT",
    `Created account ${created.email} with role ${created.role}`
  );
  saveDb(db);
  const { password: _pw, ...rest } = created;
  return rest;
}

export function updateUserAccountRole(
  user: SessionUser | null,
  targetUserId: string,
  newRole: UserRole
): void {
  const verified = verifyServerAccess(user, "system_management");
  if (verified.id === targetUserId) {
    throw new RLSViolationError(
      "Privilege policy: a user cannot change their own role."
    );
  }
  const db = loadDb();
  const target = db.users.find((u) => u.id === targetUserId);
  if (!target) throw new Error("User account not found.");
  const oldRole = target.role;
  target.role = newRole;
  appendAudit(
    db,
    verified,
    "UPDATE_USER_ROLE",
    `Changed role for ${target.email}: ${oldRole} -> ${newRole}`
  );
  saveDb(db);
}

export function deleteUserAccount(
  user: SessionUser | null,
  targetUserId: string
): void {
  const verified = verifyServerAccess(user, "system_management");
  if (verified.id === targetUserId) {
    throw new Error("Cannot delete your own active administrator account.");
  }
  const db = loadDb();
  const target = db.users.find((u) => u.id === targetUserId);
  if (!target) throw new Error("User account not found.");
  db.users = db.users.filter((u) => u.id !== targetUserId);
  appendAudit(
    db,
    verified,
    "DELETE_USER_ACCOUNT",
    `Deleted account ${target.email} (${target.role})`
  );
  saveDb(db);
}

export function getMedicalLists(): MedicalListItem[] {
  return [...loadDb().medicalLists];
}

export function addOrUpdateMedicalListItem(
  user: SessionUser | null,
  item: {
    id?: string;
    category: "investigation" | "symptom" | "diagnosis" | "specialty";
    name: string;
    groupName?: string;
    points?: number;
  }
): MedicalListItem {
  const verified = verifyServerAccess(user, "system_management");
  const cleanName = sanitizeText(item.name, 160);
  if (!cleanName) {
    throw new ValidationError("Item name is required.");
  }
  const cleanGroup = sanitizeText(item.groupName ?? "General", 80) || "General";
  if (item.points !== undefined) {
    const p = Number(item.points);
    if (!Number.isFinite(p) || p < -5 || p > 10) {
      throw new ValidationError("Symptom points must be between -5 and +10.");
    }
  }

  const db = loadDb();
  const now = new Date().toISOString();
  if (item.id) {
    const existing = db.medicalLists.find((m) => m.id === item.id);
    if (!existing) throw new Error("Medical list item not found.");
    existing.name = cleanName;
    existing.groupName = cleanGroup;
    if (item.points !== undefined) existing.points = Math.round(Number(item.points));
    existing.updatedAt = now;
    appendAudit(
      db,
      verified,
      "UPDATE_MEDICAL_LIST",
      `Updated ${existing.category} "${existing.name}"${existing.points !== undefined ? ` (${existing.points} pts)` : ""}`
    );
    saveDb(db);
    return existing;
  }

  const code = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const created: MedicalListItem = {
    id: `ml-${Date.now()}`,
    category: item.category,
    code,
    name: cleanName,
    groupName: cleanGroup,
    points:
      item.category === "symptom"
        ? Math.round(Number(item.points ?? 0))
        : undefined,
    updatedAt: now,
  };
  db.medicalLists = [...db.medicalLists, created];
  appendAudit(
    db,
    verified,
    "ADD_MEDICAL_LIST_ITEM",
    `Added ${created.category} "${created.name}"`
  );
  saveDb(db);
  return created;
}

export function deleteMedicalListItem(
  user: SessionUser | null,
  itemId: string
): void {
  const verified = verifyServerAccess(user, "system_management");
  const db = loadDb();
  const target = db.medicalLists.find((m) => m.id === itemId);
  if (!target) throw new Error("Item not found.");
  db.medicalLists = db.medicalLists.filter((m) => m.id !== itemId);
  appendAudit(
    db,
    verified,
    "DELETE_MEDICAL_LIST_ITEM",
    `Deleted ${target.category} "${target.name}"`
  );
  saveDb(db);
}

export function getLabRanges(): LabRangeItem[] {
  return [...loadDb().labRanges];
}

export function updateLabRangeConfig(
  user: SessionUser | null,
  labId: string,
  updates: { low: number; high: number; max_points: number }
): LabRangeItem {
  const verified = verifyServerAccess(user, "system_management");
  const low = Number(updates.low);
  const high = Number(updates.high);
  const maxPoints = Number(updates.max_points);
  if (
    !Number.isFinite(low) ||
    !Number.isFinite(high) ||
    low < 0 ||
    high <= low
  ) {
    throw new ValidationError(
      "Normal high threshold must be greater than normal low (>= 0)."
    );
  }
  if (!Number.isFinite(maxPoints) || maxPoints < 0 || maxPoints > 10) {
    throw new ValidationError("Max points must be between 0 and 10.");
  }

  const db = loadDb();
  const lab = db.labRanges.find((l) => l.id === labId);
  if (!lab) throw new Error("Lab test not found.");
  lab.low = low;
  lab.high = high;
  lab.max_points = Math.round(maxPoints);
  lab.updatedAt = new Date().toISOString();
  appendAudit(
    db,
    verified,
    "UPDATE_LAB_RANGE",
    `Updated ${lab.label}: normal ${lab.low}-${lab.high} ${lab.unit}, max +${lab.max_points} pts`
  );
  saveDb(db);
  return lab;
}

export function listRecentAuditChanges(
  user: SessionUser | null
): AuditLogEntry[] {
  verifyServerAccess(user, "system_management");
  const db = loadDb();
  // Return a defensive deep clone so normal code cannot mutate audit_log entries
  return JSON.parse(JSON.stringify(db.auditLog.slice(0, 200)));
}

export function exportDatabaseBackup(user: SessionUser | null): string {
  const verified = verifyServerAccess(user, "system_management");
  const db = loadDb();
  appendAudit(
    db,
    verified,
    "EXPORT_SYSTEM_BACKUP",
    "Downloaded full database backup JSON"
  );
  saveDb(db);
  return JSON.stringify(db, null, 2);
}

export function restoreDatabaseFromBackup(
  user: SessionUser | null,
  rawJson: string
): { restoredPatients: number } {
  const verified = verifyServerAccess(user, "system_management");
  if (!rawJson || rawJson.length > 5 * 1024 * 1024) {
    throw new ValidationError("Backup payload exceeds 5 MB limit.");
  }
  const parsed = JSON.parse(rawJson) as DatabaseState;
  if (
    !parsed ||
    !Array.isArray(parsed.users) ||
    !Array.isArray(parsed.patients) ||
    !Array.isArray(parsed.visits) ||
    !Array.isArray(parsed.auditLog)
  ) {
    throw new ValidationError(
      "Invalid backup file structure: missing required table arrays."
    );
  }
  appendAudit(
    parsed,
    verified,
    "RESTORE_SYSTEM_BACKUP",
    "Restored system state from backup file"
  );
  saveDb(parsed);
  return { restoredPatients: parsed.patients.length };
}

// ============================================================================
// 5. MY HEALTH (Patient only via RLS, strictly own rows only)
// ============================================================================

export function getPatientMyHealthResults(
  user: SessionUser | null,
  targetPatientId?: string
): { patient: PatientRecord; results: PatientHealthResult[] } {
  const verifiedSession = verifyServerAccess(user, "my_health");
  const effectivePatientId =
    targetPatientId ?? verifiedSession.linkedPatientId ?? "";
  const verified = assertPatientOwnRecord(verifiedSession, effectivePatientId);

  const db = loadDb();
  const patient = db.patients.find((p) => p.id === verified.linkedPatientId);
  if (!patient) {
    throw new Error("Linked patient record not found.");
  }

  // Row-level filter: strictly rows matching both patientId and patientUserId
  const results = db.patientResults
    .filter(
      (r) =>
        r.patientId === verified.linkedPatientId &&
        r.patientUserId === verified.id
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return { patient, results };
}
