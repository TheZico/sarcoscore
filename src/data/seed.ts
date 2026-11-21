import model from "@/data/model.json";
import { score } from "@/lib/scoring";
import { UserRole } from "@/lib/rls";

export interface DemoUserAccount {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  linkedPatientId?: string;
  createdAt: string;
}

export interface PatientRecord {
  id: string; // internal ID used in URLs (never national_id)
  patientCode: string;
  nationalId: string; // 14-digit fake Egyptian national ID
  fullName: string;
  gender: "Female" | "Male";
  dob: string;
  phone: string;
  historySummary: string;
  recordedDiagnosis: string;
  patientUserId?: string;
  createdBy: string;
  lastOpenedAt: string;
  createdAt: string;
}

export interface VisitRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  symptoms: string[];
  labs: Record<string, number | undefined>;
  investigations: string[];
  clinicalNotes: string;
  total: number;
  probability: number;
  level: string;
  modelVersion: string;
}

export interface MedicalListItem {
  id: string;
  category: "investigation" | "symptom" | "diagnosis" | "specialty";
  code: string;
  name: string;
  groupName: string;
  points?: number;
  updatedAt: string;
}

export interface LabRangeItem {
  id: string;
  label: string;
  unit: string;
  low: number;
  high: number;
  direction: "high" | "low";
  max_points: number;
  updatedAt: string;
}

export interface ImportedCaseRecord {
  id: string;
  uploadedBy: string;
  uploadedByEmail: string;
  entryMethod?: "upload" | "manual";
  fileName: string;
  fileType: "Excel" | "PDF" | "Manual";
  caseSummary: {
    caseCode: string;
    age: number;
    gender: "Female" | "Male";
    source: string;
    symptoms: string[];
    investigations: string;
    testValues?: Record<string, string>;
    confirmedDisease: string;
    diagnosticTimeMonths: number;
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PatientHealthResult {
  id: string;
  patientId: string;
  patientUserId: string;
  title: string;
  category: "Scan / Imaging" | "Laboratory Test";
  valueSummary: string;
  referenceRange: string;
  date: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  target: string;
  at: string;
}

export const DEMO_USERS: DemoUserAccount[] = [
  {
    id: "usr-admin-01",
    email: "admin@sarcoscore.demo",
    password: "demo1234",
    fullName: "admin",
    role: "admin",
    createdAt: "2026-10-01T09:00:00Z",
  },
  {
    id: "usr-doctor-01",
    email: "doctor@sarcoscore.demo",
    password: "demo1234",
    fullName: "Dr. Nadia El-Sayed (Pulmonology)",
    role: "doctor",
    createdAt: "2026-10-02T09:30:00Z",
  },
  {
    id: "usr-researcher-01",
    email: "researcher@sarcoscore.demo",
    password: "demo1234",
    fullName: "Dr. Karim Hassan (Clinical Research)",
    role: "researcher",
    createdAt: "2026-10-03T10:15:00Z",
  },
  {
    id: "usr-patient-01",
    email: "patient@sarcoscore.demo",
    password: "demo1234",
    fullName: "Amina Farouk (Demo Patient #1)",
    role: "patient",
    linkedPatientId: "pat-1001",
    createdAt: "2026-10-05T11:00:00Z",
  },
];

export const SEED_PATIENTS: PatientRecord[] = [
  {
    id: "pat-1001",
    patientCode: "PT-2026-001",
    nationalId: "28405120101234",
    fullName: "Amina Farouk El-Masry",
    gender: "Female",
    dob: "1984-05-12",
    phone: "+20 100 000 1001",
    historySummary:
      "42-year-old non-smoker presenting with 5-month persistent dry cough, bilateral ankle arthralgia, and erythematous skin plaques on shins. Non-caseating granulomas under investigation.",
    recordedDiagnosis: "Pulmonary & Cutaneous Sarcoidosis (Biopsy Pending)",
    patientUserId: "usr-patient-01",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-11T11:30:00Z",
    createdAt: "2026-10-12T09:00:00Z",
  },
  {
    id: "pat-1002",
    patientCode: "PT-2026-002",
    nationalId: "27908230102345",
    fullName: "Tarek Mahmoud Abdel-Aziz",
    gender: "Male",
    dob: "1979-08-23",
    phone: "+20 100 000 1002",
    historySummary:
      "47-year-old male with progressive exertional dyspnea, palpitations, first-degree AV block on ECG, and symmetric hilar lymphadenopathy on chest CT.",
    recordedDiagnosis: "Suspected Cardiac & Pulmonary Sarcoidosis",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-11T10:15:00Z",
    createdAt: "2026-10-14T10:30:00Z",
  },
  {
    id: "pat-1003",
    patientCode: "PT-2026-003",
    nationalId: "29103150203456",
    fullName: "Salma Ibrahim Mostafa",
    gender: "Female",
    dob: "1991-03-15",
    phone: "+20 100 000 1003",
    historySummary:
      "35-year-old female presenting with drenching night sweats, 7 kg weight loss over 3 months, and low-grade evening fever. Referred to rule out tuberculosis vs. lymphoma.",
    recordedDiagnosis: "Pulmonary Tuberculosis (Look-Alike Confirmed)",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-10T16:40:00Z",
    createdAt: "2026-10-15T12:00:00Z",
  },
  {
    id: "pat-1004",
    patientCode: "PT-2026-004",
    nationalId: "26811040104567",
    fullName: "Hossam El-Din Adel",
    gender: "Male",
    dob: "1968-11-04",
    phone: "+20 100 000 1004",
    historySummary:
      "58-year-old male with incidental bilateral hilar adenopathy on routine chest X-ray, mild dry cough, and elevated serum calcium.",
    recordedDiagnosis: "Stage II Pulmonary Sarcoidosis",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-10T14:20:00Z",
    createdAt: "2026-10-18T08:45:00Z",
  },
  {
    id: "pat-1005",
    patientCode: "PT-2026-005",
    nationalId: "27502190105678",
    fullName: "Laila Youssef Kamel",
    gender: "Female",
    dob: "1975-02-19",
    phone: "+20 100 000 1005",
    historySummary:
      "51-year-old female with chronic dry cough, joint pain, raised ACE level, and perilymphatic pulmonary nodules on HRCT.",
    recordedDiagnosis: "Confirmed Pulmonary Sarcoidosis",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-09T17:10:00Z",
    createdAt: "2026-10-20T11:15:00Z",
  },
  {
    id: "pat-1006",
    patientCode: "PT-2026-006",
    nationalId: "28807300106789",
    fullName: "Omar Khaled Soliman",
    gender: "Male",
    dob: "1988-07-30",
    phone: "+20 100 000 1006",
    historySummary:
      "38-year-old male with right upper quadrant discomfort, mild splenomegaly, and elevated alkaline phosphatase (ALP).",
    recordedDiagnosis: "Hepatosplenic Granulomatous Disease under Workup",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-08T13:00:00Z",
    createdAt: "2026-10-22T09:30:00Z",
  },
  {
    id: "pat-1007",
    patientCode: "PT-2026-007",
    nationalId: "26309100107890",
    fullName: "Samira Fawzy Othman",
    gender: "Female",
    dob: "1963-09-10",
    phone: "+20 100 000 1007",
    historySummary:
      "63-year-old female with nasal obstruction, lupus pernio skin lesions, and bilateral hilar lymphadenopathy.",
    recordedDiagnosis: "Sinonasal & Cutaneous Sarcoidosis",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-07T15:45:00Z",
    createdAt: "2026-10-24T14:00:00Z",
  },
  {
    id: "pat-1008",
    patientCode: "PT-2026-008",
    nationalId: "29512010108901",
    fullName: "Yasser Magdy Naguib",
    gender: "Male",
    dob: "1995-12-01",
    phone: "+20 100 000 1008",
    historySummary:
      "30-year-old male with cervical lymphadenopathy, night sweats, weight loss, and fatigue. Excisional lymph node biopsy ordered.",
    recordedDiagnosis: "Hodgkin's Lymphoma (Look-Alike Confirmed)",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-06T12:10:00Z",
    createdAt: "2026-10-25T16:20:00Z",
  },
  {
    id: "pat-1009",
    patientCode: "PT-2026-009",
    nationalId: "28104250109012",
    fullName: "Heba Ashraf Zaki",
    gender: "Female",
    dob: "1981-04-25",
    phone: "+20 100 000 1009",
    historySummary:
      "45-year-old female with shortness of breath, lymphopenia, and mild CRP elevation.",
    recordedDiagnosis: "Observation / Chest CT Follow-up",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-05T10:00:00Z",
    createdAt: "2026-10-27T09:10:00Z",
  },
  {
    id: "pat-1010",
    patientCode: "PT-2026-010",
    nationalId: "27206180100123",
    fullName: "Mona Saeed El-Shazly",
    gender: "Female",
    dob: "1972-06-18",
    phone: "+20 100 000 1010",
    historySummary:
      "54-year-old female with symmetric hilar lymphadenopathy, erythema nodosum, ankle joint pain, and markedly elevated ACE (118 U/L).",
    recordedDiagnosis: "Löfgren Syndrome / Acute Sarcoidosis",
    createdBy: "usr-doctor-01",
    lastOpenedAt: "2026-11-11T09:50:00Z",
    createdAt: "2026-10-29T13:30:00Z",
  },
];

function createSeedVisit(params: {
  id: string;
  patientId: string;
  date: string;
  symptoms: string[];
  labs: Record<string, number | undefined>;
  investigations: string[];
  clinicalNotes: string;
}): VisitRecord {
  const result = score({ symptoms: params.symptoms, labs: params.labs });
  return {
    id: params.id,
    patientId: params.patientId,
    doctorId: "usr-doctor-01",
    doctorName: "Dr. Nadia El-Sayed",
    date: params.date,
    symptoms: params.symptoms,
    labs: params.labs,
    investigations: params.investigations,
    clinicalNotes: params.clinicalNotes,
    total: result.total,
    probability: result.probability,
    level: result.level,
    modelVersion: model.version,
  };
}

export const SEED_VISITS: VisitRecord[] = [
  // Patient 1001: 2 visits showing progression from Moderate -> High
  createSeedVisit({
    id: "vis-3001a",
    patientId: "pat-1001",
    date: "2026-10-12T09:30:00Z",
    symptoms: ["dry_cough", "joint_back_pain"],
    labs: { ace: 58, crp: 8 },
    investigations: ["Chest X-ray", "CRP", "ACE"],
    clinicalNotes:
      "Initial presentation with dry cough and ankle joint pain. Mild ACE elevation; ordered high-resolution chest CT.",
  }),
  createSeedVisit({
    id: "vis-3001b",
    patientId: "pat-1001",
    date: "2026-11-09T11:00:00Z",
    symptoms: [
      "imaging_enlarged_chest_lymph_nodes",
      "dry_cough",
      "skin_lesions_itching",
      "joint_back_pain",
    ],
    labs: { ace: 110, serum_calcium: 10.9, crp: 12 },
    investigations: ["CT Scan", "ACE", "Serum Calcium", "Skin Biopsy Scheduled"],
    clinicalNotes:
      "HRCT confirmed bilateral hilar lymphadenopathy. Serum ACE rose to 110 U/L. Referred for endobronchial ultrasound biopsy after ruling out TB.",
  }),
  // Patient 1002: High likelihood cardiac + chest presentation
  createSeedVisit({
    id: "vis-3002",
    patientId: "pat-1002",
    date: "2026-11-08T10:30:00Z",
    symptoms: [
      "imaging_enlarged_chest_lymph_nodes",
      "imaging_lung_nodules_infiltrates",
      "shortness_of_breath",
      "palpitations_heart_block",
      "heart_tests_abnormal_ecg_echo_mri",
    ],
    labs: { ace: 92, lymphocyte_count: 0.7 },
    investigations: ["CT Scan", "Electrocardiogram (ECG)", "Cardiac MRI", "ACE"],
    clinicalNotes:
      "Bilateral hilar lymphadenopathy with conduction block on ECG and lymphopenia. High clinical suspicion for cardiac sarcoidosis.",
  }),
  // Patient 1003: Look-alike TB case (Low likelihood)
  createSeedVisit({
    id: "vis-3003",
    patientId: "pat-1003",
    date: "2026-11-05T14:00:00Z",
    symptoms: ["night_sweats", "weight_loss", "fever_fatigue"],
    labs: { esr: 35, wbc: 12.1 },
    investigations: ["Chest X-ray", "TB GOLD TEST", "Tuberculin Skin Test (TST)"],
    clinicalNotes:
      "Constitutional B-symptoms (night sweats, weight loss, fever) strongly favor infectious look-alike. Sputum & TB Gold positive.",
  }),
  // Patient 1004: High likelihood
  createSeedVisit({
    id: "vis-3004",
    patientId: "pat-1004",
    date: "2026-11-06T09:15:00Z",
    symptoms: [
      "imaging_enlarged_chest_lymph_nodes",
      "dry_cough",
      "imaging_lung_nodules_infiltrates",
    ],
    labs: { serum_calcium: 12.4, ace: 84 },
    investigations: ["Chest X-ray", "CT Scan", "Serum Calcium", "ACE"],
    clinicalNotes:
      "Hypercalcemia with bilateral hilar adenopathy and pulmonary infiltrates.",
  }),
  // Patient 1005: High likelihood
  createSeedVisit({
    id: "vis-3005",
    patientId: "pat-1005",
    date: "2026-11-04T11:45:00Z",
    symptoms: [
      "imaging_enlarged_chest_lymph_nodes",
      "dry_cough",
      "joint_back_pain",
    ],
    labs: { ace: 108, esr: 28 },
    investigations: ["CT Scan", "Biopsy", "ACE"],
    clinicalNotes:
      "Classic pulmonary presentation with ACE > 2x upper limit of normal.",
  }),
  // Patient 1006: Moderate likelihood
  createSeedVisit({
    id: "vis-3006",
    patientId: "pat-1006",
    date: "2026-11-02T13:20:00Z",
    symptoms: ["enlarged_spleen", "liver_tests_abnormal", "abdominal_pain"],
    labs: { alp: 245, ace: 64 },
    investigations: ["Abdominal Ultrasound", "Liver Function Tests", "ACE"],
    clinicalNotes:
      "Splenomegaly with cholestatic liver enzyme elevation and mild ACE increase.",
  }),
  // Patient 1007: High likelihood
  createSeedVisit({
    id: "vis-3007",
    patientId: "pat-1007",
    date: "2026-11-01T15:00:00Z",
    symptoms: [
      "imaging_enlarged_chest_lymph_nodes",
      "skin_lesions_itching",
      "blocked_nose",
      "oral_ulcers",
    ],
    labs: { ace: 96 },
    investigations: ["Chest X-ray", "Nasal Endoscopy", "ACE"],
    clinicalNotes:
      "Upper respiratory tract involvement with chronic skin lesions and hilar adenopathy.",
  }),
  // Patient 1008: Low likelihood (Lymphoma look-alike)
  createSeedVisit({
    id: "vis-3008",
    patientId: "pat-1008",
    date: "2026-10-30T10:00:00Z",
    symptoms: ["night_sweats", "weight_loss", "enlarged_lymph_nodes"],
    labs: { ldh: 380 },
    investigations: ["PET Scan", "Excisional Lymph Node Biopsy", "LDH"],
    clinicalNotes:
      "Negative score weights from night sweats and weight loss; biopsy confirmed Hodgkin's lymphoma.",
  }),
  // Patient 1009: Moderate likelihood
  createSeedVisit({
    id: "vis-3009",
    patientId: "pat-1009",
    date: "2026-10-29T12:30:00Z",
    symptoms: ["shortness_of_breath", "dry_cough"],
    labs: { lymphocyte_count: 0.65, crp: 7 },
    investigations: ["Chest X-ray", "CBC with Differential", "CRP"],
    clinicalNotes:
      "Exertional dyspnea with lymphopenia; scheduled follow-up chest CT.",
  }),
  // Patient 1010: High likelihood
  createSeedVisit({
    id: "vis-3010",
    patientId: "pat-1010",
    date: "2026-11-10T09:20:00Z",
    symptoms: [
      "imaging_enlarged_chest_lymph_nodes",
      "skin_lesions_itching",
      "joint_back_pain",
      "dry_cough",
    ],
    labs: { ace: 118, esr: 42 },
    investigations: ["CT Scan", "ACE", "ESR"],
    clinicalNotes:
      "Löfgren presentation with erythema nodosum, bilateral ankle arthritis, and hilar adenopathy.",
  }),
];

export const SEED_MEDICAL_LISTS: MedicalListItem[] = [
  // All 23 symptoms/findings seeded directly from model.json
  ...model.features.map((f) => ({
    id: `sym-${f.id}`,
    category: "symptom" as const,
    code: f.id,
    name: f.label,
    groupName: f.group,
    points: f.points,
    updatedAt: "2026-10-27T00:00:00Z",
  })),
  // Investigations from Methodology Fig. (2)
  {
    id: "inv-ct-scan",
    category: "investigation",
    code: "ct_scan",
    name: "CT Scan (High-Resolution Chest CT)",
    groupName: "Imaging & Radiology",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "inv-pet-scan",
    category: "investigation",
    code: "pet_scan",
    name: "PET Scan (FDG-PET)",
    groupName: "Imaging & Radiology",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "inv-chest-xray",
    category: "investigation",
    code: "chest_xray",
    name: "Chest X-ray",
    groupName: "Imaging & Radiology",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "inv-biopsy",
    category: "investigation",
    code: "biopsy",
    name: "Tissue Biopsy (Non-caseating Granulomas)",
    groupName: "Pathology & Biopsy",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "inv-ecg",
    category: "investigation",
    code: "ecg",
    name: "Electrocardiogram (ECG)",
    groupName: "Cardiac Evaluation",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "inv-cmr",
    category: "investigation",
    code: "cmr",
    name: "Cardiac Magnetic Resonance (CMR)",
    groupName: "Cardiac Evaluation",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "inv-balf",
    category: "investigation",
    code: "balf",
    name: "Bronchoalveolar Lavage Fluid (BALF)",
    groupName: "Respiratory & Specialized",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "inv-tb-gold",
    category: "investigation",
    code: "tb_gold",
    name: "TB GOLD Test (IGRA)",
    groupName: "Immunological & Other",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  // Diagnoses (Sarcoidosis + look-alikes from model.json)
  {
    id: "diag-sarcoidosis",
    category: "diagnosis",
    code: "sarcoidosis",
    name: "Confirmed Sarcoidosis",
    groupName: "Granulomatous",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  ...model.stats.lookalike_diseases.map((d, idx) => ({
    id: `diag-lookalike-${idx + 1}`,
    category: "diagnosis" as const,
    code: d.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    name: d,
    groupName: "Look-Alike Differential",
    updatedAt: "2026-10-27T00:00:00Z",
  })),
  // Specialties
  {
    id: "spec-pulm",
    category: "specialty",
    code: "pulmonology",
    name: "Pulmonology & Respiratory Medicine",
    groupName: "Clinical Specialty",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "spec-cardio",
    category: "specialty",
    code: "cardiology",
    name: "Cardiology & Electrophysiology",
    groupName: "Clinical Specialty",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "spec-rheum",
    category: "specialty",
    code: "rheumatology",
    name: "Rheumatology & Immunology",
    groupName: "Clinical Specialty",
    updatedAt: "2026-10-27T00:00:00Z",
  },
  {
    id: "spec-derm",
    category: "specialty",
    code: "dermatology",
    name: "Dermatology",
    groupName: "Clinical Specialty",
    updatedAt: "2026-10-27T00:00:00Z",
  },
];

export const SEED_LAB_RANGES: LabRangeItem[] = model.labs.map((lab) => ({
  id: lab.id,
  label: lab.label,
  unit: lab.unit,
  low: lab.low,
  high: lab.high,
  direction: lab.direction as "high" | "low",
  max_points: lab.max_points,
  updatedAt: "2026-10-27T00:00:00Z",
}));

export const SEED_IMPORTED_CASES: ImportedCaseRecord[] = [
  {
    id: "imp-4001",
    uploadedBy: "usr-researcher-01",
    uploadedByEmail: "researcher@sarcoscore.demo",
    fileName: "pubmed_sarcoidosis_batch_nov2026.xlsx",
    fileType: "Excel",
    caseSummary: {
      caseCode: "LIT-2026-31",
      age: 46,
      gender: "Female",
      source: "PubMed Case Report",
      symptoms: [
        "imaging_enlarged_chest_lymph_nodes",
        "dry_cough",
        "skin_lesions_itching",
      ],
      investigations: "HRCT Chest, Serum ACE 104 U/L, Transbronchial Biopsy",
      confirmedDisease: "Sarcoidosis",
      diagnosticTimeMonths: 5,
    },
    status: "pending",
    createdAt: "2026-11-10T14:30:00Z",
  },
  {
    id: "imp-4002",
    uploadedBy: "usr-researcher-01",
    uploadedByEmail: "researcher@sarcoscore.demo",
    fileName: "scholar_lymphoma_mimic_case32.pdf",
    fileType: "PDF",
    caseSummary: {
      caseCode: "LIT-2026-32",
      age: 39,
      gender: "Male",
      source: "Google Scholar Case Series",
      symptoms: ["night_sweats", "weight_loss", "enlarged_lymph_nodes"],
      investigations: "FDG-PET, Excisional Node Biopsy, LDH 340 U/L",
      confirmedDisease: "Hodgkin’s lymphoma",
      diagnosticTimeMonths: 4,
    },
    status: "pending",
    createdAt: "2026-11-11T08:45:00Z",
  },
];

export const SEED_PATIENT_RESULTS: PatientHealthResult[] = [
  // Results belonging to Demo Patient #1 (pat-1001 / usr-patient-01)
  {
    id: "res-5001",
    patientId: "pat-1001",
    patientUserId: "usr-patient-01",
    title: "High-Resolution Chest CT (HRCT)",
    category: "Scan / Imaging",
    valueSummary:
      "Symmetric bilateral hilar and mediastinal lymphadenopathy; mild perilymphatic micronodules in upper lobes.",
    referenceRange: "No lymphadenopathy or infiltrates",
    date: "2026-11-09",
  },
  {
    id: "res-5002",
    patientId: "pat-1001",
    patientUserId: "usr-patient-01",
    title: "Serum Angiotensin-Converting Enzyme (ACE)",
    category: "Laboratory Test",
    valueSummary: "110 U/L (Elevated)",
    referenceRange: "8 – 52 U/L",
    date: "2026-11-09",
  },
  {
    id: "res-5003",
    patientId: "pat-1001",
    patientUserId: "usr-patient-01",
    title: "Serum Calcium",
    category: "Laboratory Test",
    valueSummary: "10.9 mg/dL (Mildly Elevated)",
    referenceRange: "8.5 – 10.5 mg/dL",
    date: "2026-11-09",
  },
  {
    id: "res-5004",
    patientId: "pat-1001",
    patientUserId: "usr-patient-01",
    title: "Baseline Chest X-Ray (PA & Lateral)",
    category: "Scan / Imaging",
    valueSummary:
      "Bilateral hilar prominence noted; clear costophrenic angles.",
    referenceRange: "Normal cardiomediastinal silhouette",
    date: "2026-10-12",
  },
  {
    id: "res-5005",
    patientId: "pat-1001",
    patientUserId: "usr-patient-01",
    title: "TB Gold (IGRA) & Sputum AFB",
    category: "Laboratory Test",
    valueSummary: "Negative (Mycobacterial infection ruled out)",
    referenceRange: "Negative",
    date: "2026-10-15",
  },
  // Result belonging to another patient (pat-1002) to verify RLS isolation
  {
    id: "res-5999",
    patientId: "pat-1002",
    patientUserId: "usr-other-patient-99",
    title: "Cardiac MRI with Late Gadolinium Enhancement",
    category: "Scan / Imaging",
    valueSummary: "Basal septal myocardial inflammation.",
    referenceRange: "No myocardial enhancement",
    date: "2026-11-08",
  },
];

export const SEED_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "aud-01",
    userId: "usr-admin-01",
    userEmail: "admin@sarcoscore.demo",
    userRole: "admin",
    action: "SEED_MODEL_RANGES",
    target: "Initialized scoring model v2026-10-27 (23 findings, 8 lab ranges)",
    at: "2026-10-27T09:00:00Z",
  },
  {
    id: "aud-02",
    userId: "usr-doctor-01",
    userEmail: "doctor@sarcoscore.demo",
    userRole: "doctor",
    action: "CREATE_VISIT",
    target: "Patient PT-2026-001 (Visit score: 97% High, +16 pts)",
    at: "2026-11-09T11:00:00Z",
  },
  {
    id: "aud-03",
    userId: "usr-researcher-01",
    userEmail: "researcher@sarcoscore.demo",
    userRole: "researcher",
    action: "IMPORT_CASE_PENDING",
    target: "Uploaded pubmed_sarcoidosis_batch_nov2026.xlsx (status: pending)",
    at: "2026-11-10T14:30:00Z",
  },
];

