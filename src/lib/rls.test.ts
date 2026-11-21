import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import {
  canAccessFeature,
  canUseQuickCalculator,
  assertQuickCalculatorAccess,
  ROLE_HOME_ROUTE,
  RLSViolationError,
  isValidNationalId,
} from "./rls";
import { ValidationError } from "./validation";
import { RateLimitError } from "./security";
import {
  resetDbToSeed,
  authenticateWithEmailPassword,
  listPatientsForDashboard,
  getPatientRecordById,
  listVisitsForPatient,
  createPatientFile,
  addClinicalVisit,
  listImportedCases,
  submitImportedResearchCase,
  submitManualResearchCase,
  updateImportedCaseStatus,
  listUserAccounts,
  createUserAccount,
  updateUserAccountRole,
  deleteUserAccount,
  addOrUpdateMedicalListItem,
  updateLabRangeConfig,
  listRecentAuditChanges,
  getPatientMyHealthResults,
  exportDatabaseBackup,
  restoreDatabaseFromBackup,
} from "./db";

describe("SarcoScore Auth, Roles, Row Level Security (RLS) & Security Hardening", () => {
  beforeEach(() => {
    resetDbToSeed();
  });

  it("authenticates each of the 4 seeded role accounts and maps to the correct home route", () => {
    const admin = authenticateWithEmailPassword("admin@sarcoscore.demo", "demo1234");
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");
    const researcher = authenticateWithEmailPassword("researcher@sarcoscore.demo", "demo1234");
    const patient = authenticateWithEmailPassword("patient@sarcoscore.demo", "demo1234");

    expect(admin.role).toBe("admin");
    expect(admin.fullName).toBe("admin");
    expect(ROLE_HOME_ROUTE[admin.role]).toBe("/dashboard");

    expect(doctor.role).toBe("doctor");
    expect(ROLE_HOME_ROUTE[doctor.role]).toBe("/dashboard");

    expect(researcher.role).toBe("researcher");
    expect(ROLE_HOME_ROUTE[researcher.role]).toBe("/research");

    expect(patient.role).toBe("patient");
    expect(ROLE_HOME_ROUTE[patient.role]).toBe("/my-health");
  });

  it("enforces the exact 4-role x 6-feature permission matrix", () => {
    const admin = authenticateWithEmailPassword("admin@sarcoscore.demo", "demo1234");
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");
    const researcher = authenticateWithEmailPassword("researcher@sarcoscore.demo", "demo1234");
    const patient = authenticateWithEmailPassword("patient@sarcoscore.demo", "demo1234");

    // Admin: Y, Y, Y, Y, Y, N
    expect(canAccessFeature(admin, "dashboard")).toBe(true);
    expect(canAccessFeature(admin, "create_review")).toBe(true);
    expect(canAccessFeature(admin, "patient_profile")).toBe(true);
    expect(canAccessFeature(admin, "research_insights")).toBe(true);
    expect(canAccessFeature(admin, "system_management")).toBe(true);
    expect(canAccessFeature(admin, "my_health")).toBe(false);

    // Doctor: Y, Y, Y, N, N, N
    expect(canAccessFeature(doctor, "dashboard")).toBe(true);
    expect(canAccessFeature(doctor, "create_review")).toBe(true);
    expect(canAccessFeature(doctor, "patient_profile")).toBe(true);
    expect(canAccessFeature(doctor, "research_insights")).toBe(false);
    expect(canAccessFeature(doctor, "system_management")).toBe(false);
    expect(canAccessFeature(doctor, "my_health")).toBe(false);

    // Researcher: N, N, N, Y, N, N
    expect(canAccessFeature(researcher, "dashboard")).toBe(false);
    expect(canAccessFeature(researcher, "create_review")).toBe(false);
    expect(canAccessFeature(researcher, "patient_profile")).toBe(false);
    expect(canAccessFeature(researcher, "research_insights")).toBe(true);
    expect(canAccessFeature(researcher, "system_management")).toBe(false);
    expect(canAccessFeature(researcher, "my_health")).toBe(false);

    // Patient: N, N, N, N, N, Y
    expect(canAccessFeature(patient, "dashboard")).toBe(false);
    expect(canAccessFeature(patient, "create_review")).toBe(false);
    expect(canAccessFeature(patient, "patient_profile")).toBe(false);
    expect(canAccessFeature(patient, "research_insights")).toBe(false);
    expect(canAccessFeature(patient, "system_management")).toBe(false);
    expect(canAccessFeature(patient, "my_health")).toBe(true);
  });

  it("requires login for Quick Calculator: blocks logged-out visitors (-> /login) and Patients (-> /my-health), while allowing Doctor, Admin, and Researcher", () => {
    const admin = authenticateWithEmailPassword("admin@sarcoscore.demo", "demo1234");
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");
    const researcher = authenticateWithEmailPassword("researcher@sarcoscore.demo", "demo1234");
    const patient = authenticateWithEmailPassword("patient@sarcoscore.demo", "demo1234");

    // 1. Logged-out visitor (null) -> blocked on Quick Calculator and all protected internal routes (-> /login)
    expect(canUseQuickCalculator(null)).toBe(false);
    expect(() => assertQuickCalculatorAccess(null)).toThrow(RLSViolationError);

    for (const protectedPath of [
      "/check",
      "/dashboard",
      "/cases/new",
      "/patients/pat-1001",
      "/research",
      "/admin",
      "/my-health",
    ]) {
      const visitorReq = new NextRequest(
        `http://localhost:3000${protectedPath}`
      );
      const visitorRes = middleware(visitorReq);
      expect(visitorRes.status).toBe(307);
      expect(visitorRes.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    }

    // 2. Patient -> blocked from Quick Calculator, Dashboard, Create/Review, Patient Profile, Research, and Admin (-> /my-health)
    expect(canUseQuickCalculator(patient)).toBe(false);
    expect(() => assertQuickCalculatorAccess(patient)).toThrow(RLSViolationError);

    for (const forbiddenForPatient of [
      "/check",
      "/dashboard",
      "/cases/new",
      "/patients/pat-1001",
      "/research",
      "/admin",
    ]) {
      const patientReq = new NextRequest(
        `http://localhost:3000${forbiddenForPatient}`,
        {
          headers: { cookie: "sarcoscore_role=patient" },
        }
      );
      const patientRes = middleware(patientReq);
      expect(patientRes.status).toBe(307);
      expect(patientRes.headers.get("location")).toBe(
        "http://localhost:3000/my-health"
      );
    }

    // Patient allowed on /my-health
    const patientOwnRouteReq = new NextRequest(
      "http://localhost:3000/my-health",
      {
        headers: { cookie: "sarcoscore_role=patient" },
      }
    );
    expect(middleware(patientOwnRouteReq).status).toBe(200);

    // 3. Doctor, Admin, and Researcher -> allowed
    expect(canUseQuickCalculator(doctor)).toBe(true);
    expect(canUseQuickCalculator(admin)).toBe(true);
    expect(canUseQuickCalculator(researcher)).toBe(true);
    expect(() => assertQuickCalculatorAccess(doctor)).not.toThrow();
    expect(() => assertQuickCalculatorAccess(admin)).not.toThrow();
    expect(() => assertQuickCalculatorAccess(researcher)).not.toThrow();

    const doctorReq = new NextRequest("http://localhost:3000/check", {
      headers: { cookie: "sarcoscore_role=doctor" },
    });
    const doctorRes = middleware(doctorReq);
    expect(doctorRes.status).toBe(200);
    expect(doctorRes.headers.get("location")).toBeNull();
  });

  it("rejects all unauthenticated (null) requests across every module with RLSViolationError", () => {
    expect(() => listPatientsForDashboard(null)).toThrow(RLSViolationError);
    expect(() => getPatientRecordById(null, "pat-1001")).toThrow(RLSViolationError);
    expect(() => listImportedCases(null)).toThrow(RLSViolationError);
    expect(() => listUserAccounts(null)).toThrow(RLSViolationError);
    expect(() => listRecentAuditChanges(null)).toThrow(RLSViolationError);
    expect(() => getPatientMyHealthResults(null)).toThrow(RLSViolationError);
    expect(() => exportDatabaseBackup(null)).toThrow(RLSViolationError);
  });

  it("blocks a Doctor from reading Research imports, System Management, or My Health via RLS", () => {
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");

    // Allowed clinical operations
    expect(listPatientsForDashboard(doctor).length).toBeGreaterThanOrEqual(10);

    // Blocked by RLS
    expect(() => listImportedCases(doctor)).toThrow(RLSViolationError);
    expect(() => listUserAccounts(doctor)).toThrow(RLSViolationError);
    expect(() => listRecentAuditChanges(doctor)).toThrow(RLSViolationError);
    expect(() => getPatientMyHealthResults(doctor, "pat-1001")).toThrow(
      RLSViolationError
    );
    expect(() => exportDatabaseBackup(doctor)).toThrow(RLSViolationError);
  });

  it("supports both independent research add-case methods (Upload file OR Enter manually) with pending status and Admin/Researcher approval", () => {
    const admin = authenticateWithEmailPassword("admin@sarcoscore.demo", "demo1234");
    const researcher = authenticateWithEmailPassword(
      "researcher@sarcoscore.demo",
      "demo1234"
    );
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");

    // Method 1: File upload alone (no manual fields required)
    const uploadedOnly = submitImportedResearchCase(researcher, {
      fileName: "new_cases_only.xlsx",
    });
    expect(uploadedOnly.status).toBe("pending");
    expect(uploadedOnly.entryMethod).toBe("upload");

    // Method 2: Manual entry alone (no file upload required)
    const manualOnly = submitManualResearchCase(researcher, {
      caseCode: "LIT-2026-88",
      age: 44,
      diagnosticTimeMonths: 7,
      confirmedDisease: "Sarcoidosis",
      symptoms: ["dry_cough", "imaging_enlarged_chest_lymph_nodes"],
      testValues: {
        ace: "112 U/L",
        examinations: "HRCT bilateral hilar adenopathy",
      },
    });
    expect(manualOnly.status).toBe("pending");
    expect(manualOnly.entryMethod).toBe("manual");
    expect(manualOnly.caseSummary.caseCode).toBe("LIT-2026-88");

    // Formula injection protection: values starting with =, +, -, or @ are stored as plain text (prefixed with ')
    const formulaCase = submitManualResearchCase(researcher, {
      caseCode: "=CMD|' /C calc'!A0",
      age: 40,
      diagnosticTimeMonths: 4,
      confirmedDisease: "+HYPERLINK(\"http://evil.example\")",
      symptoms: ["dry_cough"],
      testValues: {
        ace: "-2+3",
        examinations: "@SUM(1,2)",
      },
    });
    expect(formulaCase.caseSummary.caseCode.startsWith("'=")).toBe(true);
    expect(formulaCase.caseSummary.confirmedDisease.startsWith("'+")).toBe(true);
    expect(formulaCase.caseSummary.testValues?.ace).toBe("'-2+3");
    expect(formulaCase.caseSummary.testValues?.examinations).toBe("'@SUM(1,2)");

    // Server schema validation rejects invalid manual case inputs
    expect(() =>
      submitManualResearchCase(researcher, {
        caseCode: "",
        age: 44,
        diagnosticTimeMonths: 5,
        confirmedDisease: "Sarcoidosis",
        symptoms: [],
        testValues: {},
      })
    ).toThrow(ValidationError);

    expect(() =>
      submitManualResearchCase(researcher, {
        caseCode: "LIT-BAD-AGE",
        age: 180,
        diagnosticTimeMonths: 5,
        confirmedDisease: "Sarcoidosis",
        symptoms: [],
        testValues: {},
      })
    ).toThrow(ValidationError);

    // Researcher OR Admin can approve a pending case; Doctor cannot
    expect(() =>
      updateImportedCaseStatus(doctor, manualOnly.id, "approved")
    ).toThrow(RLSViolationError);

    const researcherApproved = updateImportedCaseStatus(
      researcher,
      manualOnly.id,
      "approved"
    );
    expect(researcherApproved.status).toBe("approved");

    const adminApproved = updateImportedCaseStatus(
      admin,
      uploadedOnly.id,
      "approved"
    );
    expect(adminApproved.status).toBe("approved");

    // Researcher is still blocked from clinical Dashboard/Patient files and System Management
    expect(() => listPatientsForDashboard(researcher)).toThrow(RLSViolationError);
    expect(() => getPatientRecordById(researcher, "pat-1001")).toThrow(
      RLSViolationError
    );
    expect(() => listUserAccounts(researcher)).toThrow(RLSViolationError);
  });

  it("enforces row-level isolation (IDOR protection) so a Patient only reads their own results", () => {
    const patient = authenticateWithEmailPassword("patient@sarcoscore.demo", "demo1234");

    // Own data succeeds and never includes pat-1002's results
    const ownHealth = getPatientMyHealthResults(patient);
    expect(ownHealth.patient.id).toBe("pat-1001");
    expect(ownHealth.results.length).toBeGreaterThan(0);
    expect(ownHealth.results.every((r) => r.patientId === "pat-1001")).toBe(true);

    // IDOR: Attempting to read another patient's ID throws RLSViolationError
    expect(() => getPatientMyHealthResults(patient, "pat-1002")).toThrow(
      RLSViolationError
    );

    // Attempting to read clinical profile or visits directly throws RLSViolationError
    expect(() => getPatientRecordById(patient, "pat-1001")).toThrow(
      RLSViolationError
    );
    expect(() => listVisitsForPatient(patient, "pat-1001")).toThrow(
      RLSViolationError
    );
    expect(() => listPatientsForDashboard(patient)).toThrow(RLSViolationError);
  });

  it("blocks privilege escalation: users cannot spoof roles or change their own role", () => {
    const admin = authenticateWithEmailPassword("admin@sarcoscore.demo", "demo1234");
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");

    // Client-side role spoofing on a Doctor session object must fail server verification
    const spoofedDoctorAsAdmin = { ...doctor, role: "admin" as const };
    expect(() => listUserAccounts(spoofedDoctorAsAdmin)).toThrow(RLSViolationError);
    expect(() => updateUserAccountRole(spoofedDoctorAsAdmin, doctor.id, "admin")).toThrow(
      RLSViolationError
    );

    // Even an Admin cannot change their own role
    expect(() => updateUserAccountRole(admin, admin.id, "doctor")).toThrow(
      RLSViolationError
    );

    // Non-admins cannot create/delete users or modify medical lists / lab ranges
    expect(() =>
      createUserAccount(doctor, {
        email: "hacker@sarcoscore.demo",
        fullName: "Hacker",
        role: "admin",
      })
    ).toThrow(RLSViolationError);
    expect(() => deleteUserAccount(doctor, admin.id)).toThrow(RLSViolationError);
    expect(() =>
      addOrUpdateMedicalListItem(doctor, {
        category: "symptom",
        name: "Unauthorized Symptom",
        groupName: "General",
        points: 10,
      })
    ).toThrow(RLSViolationError);
    expect(() =>
      updateLabRangeConfig(doctor, "ace", { low: 0, high: 10, max_points: 10 })
    ).toThrow(RLSViolationError);
  });

  it("validates 13-digit, 15-digit, non-numeric, and duplicate National IDs, long text, and XSS payloads", () => {
    const admin = authenticateWithEmailPassword("admin@sarcoscore.demo", "demo1234");
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");

    // 13 digits & 15 digits & letters -> invalid
    expect(isValidNationalId("1234567890123")).toBe(false);
    expect(isValidNationalId("123456789012345")).toBe(false);
    expect(isValidNationalId("2850101010123A")).toBe(false);
    expect(isValidNationalId("28501010101234")).toBe(true);

    // Rejects 13-digit National ID
    expect(() =>
      createPatientFile(doctor, {
        fullName: "Invalid 13 Digit",
        nationalId: "2850101010123",
        gender: "Male",
        dob: "1985-01-01",
        phone: "+20 100 000 9999",
        historySummary: "Test",
      })
    ).toThrow(ValidationError);

    // Rejects 15-digit National ID
    expect(() =>
      createPatientFile(doctor, {
        fullName: "Invalid 15 Digit",
        nationalId: "285010101012345",
        gender: "Male",
        dob: "1985-01-01",
        phone: "+20 100 000 9999",
        historySummary: "Test",
      })
    ).toThrow(ValidationError);

    // Rejects very long text (> 2000 chars)
    expect(() =>
      createPatientFile(doctor, {
        fullName: "Long Text Patient",
        nationalId: "28501010108888",
        gender: "Male",
        dob: "1985-01-01",
        phone: "+20 100 000 9999",
        historySummary: "A".repeat(2500),
      })
    ).toThrow(ValidationError);

    // Strips XSS <script> tags and protects internal IDs & audit_log privacy
    const created = createPatientFile(doctor, {
      fullName: "Fake Test Patient <script>alert(1)</script>",
      nationalId: "28501010109999",
      gender: "Male",
      dob: "1985-01-01",
      phone: "+20 100 000 9999",
      historySummary: "Synthetic test record <img src=x onerror=alert(1)>",
    });
    expect(created.id).toMatch(/^pat-/);
    expect(created.id).not.toContain(created.nationalId);
    expect(created.fullName).not.toContain("<script>");
    expect(created.historySummary).not.toContain("<img");

    // Rejects duplicate 14-digit National ID
    expect(() =>
      createPatientFile(doctor, {
        fullName: "Duplicate ID Patient",
        nationalId: "28501010109999",
        gender: "Female",
        dob: "1990-01-01",
        phone: "+20 100 000 8888",
        historySummary: "Duplicate test",
      })
    ).toThrow(/already exists/);

    // Verify audit log is written, does NOT leak National ID or full name, and cannot be mutated externally
    const logs = listRecentAuditChanges(admin);
    expect(logs[0].action).toBe("CREATE_PATIENT_FILE");
    expect(logs[0].userEmail).toBe("doctor@sarcoscore.demo");
    expect(logs[0].target).not.toContain("28501010109999");
    expect(logs[0].target).not.toContain("Fake Test Patient");

    // Mutating returned audit log array does not alter stored audit_log
    logs[0].action = "TAMPERED_ACTION";
    const freshLogs = listRecentAuditChanges(admin);
    expect(freshLogs[0].action).toBe("CREATE_PATIENT_FILE");
  });

  it("validates research uploads (size limit, allowed extensions, magic bytes) and keeps imports pending", () => {
    const researcher = authenticateWithEmailPassword(
      "researcher@sarcoscore.demo",
      "demo1234"
    );

    // Disallowed file extension (.exe)
    expect(() =>
      submitImportedResearchCase(researcher, {
        fileName: "malware.exe",
      })
    ).toThrow(ValidationError);

    // Oversized file (> 5 MB)
    expect(() =>
      submitImportedResearchCase(researcher, {
        fileName: "huge_dataset.xlsx",
        fileSizeBytes: 6 * 1024 * 1024,
      })
    ).toThrow(/5 MB/);

    // Spoofed magic bytes (.pdf file with EXE MZ header)
    expect(() =>
      submitImportedResearchCase(researcher, {
        fileName: "spoofed.pdf",
        fileSizeBytes: 1024,
        magicBytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
      })
    ).toThrow(/signature does not match/);

    // Valid PDF magic bytes (%PDF) succeeds and stays "pending"
    const validPdf = submitImportedResearchCase(researcher, {
      fileName: "valid_study.pdf",
      fileSizeBytes: 2048,
      magicBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    });
    expect(validPdf.status).toBe("pending");
  });

  it("validates backup/restore structure and enforces login rate limiting", () => {
    const admin = authenticateWithEmailPassword("admin@sarcoscore.demo", "demo1234");
    const doctor = authenticateWithEmailPassword("doctor@sarcoscore.demo", "demo1234");

    // Invalid backup JSON rejected
    expect(() => restoreDatabaseFromBackup(admin, "{not-valid-json")).toThrow();
    expect(() =>
      restoreDatabaseFromBackup(admin, JSON.stringify({ data: {} }))
    ).toThrow(/missing required table arrays/);

    // Valid backup round-trip works for admin
    const backupJson = exportDatabaseBackup(admin);
    const res = restoreDatabaseFromBackup(admin, backupJson);
    expect(res.restoredPatients).toBeGreaterThanOrEqual(10);

    // Visit creation sanitizes clinical notes and ignores invalid lab numbers
    const visit = addClinicalVisit(doctor, {
      patientId: "pat-1001",
      symptoms: ["dry_cough", "dry_cough"],
      labs: { ace: 90, invalid_lab: -999 },
      investigations: ["Chest X-ray"],
      clinicalNotes: "Follow-up visit <script>evil()</script>",
    });
    expect(visit.clinicalNotes).not.toContain("<script>");

    // Rate limiting blocks brute-force login after 5 failed attempts
    for (let i = 0; i < 5; i++) {
      expect(() =>
        authenticateWithEmailPassword("doctor@sarcoscore.demo", "wrong-pass")
      ).toThrow(/Invalid email or password/);
    }
    expect(() =>
      authenticateWithEmailPassword("doctor@sarcoscore.demo", "wrong-pass")
    ).toThrow(RateLimitError);
  });
});
