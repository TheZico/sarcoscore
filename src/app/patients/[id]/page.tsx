"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import {
  getPatientRecordById,
  recordPatientFileOpened,
  listVisitsForPatient,
  updatePatientPersonalAndDiagnosis,
  addClinicalVisit,
  getMedicalLists,
  getLabRanges,
} from "@/lib/db";
import model from "@/data/model.json";
import { score } from "@/lib/scoring";
import { SymptomGroup } from "@/components/SymptomGroup";
import { LabInput } from "@/components/LabInput";
import { ResultCard } from "@/components/ResultCard";
import {
  Edit3,
  Save,
  PlusCircle,
  Stethoscope,
  Activity,
  FlaskConical,
  ClipboardCheck,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PREFERRED_GROUP_ORDER = [
  "General",
  "Chest",
  "Skin, nose & mouth",
  "Skin nose & mouth",
  "Abdomen",
  "Other",
  "Imaging & tests",
];

function levelColorHex(level: string): string {
  if (level === "High") return "#C0504D";
  if (level === "Moderate") return "#E3A21A";
  return "#2E8B57";
}

function levelBadgeClasses(level: string): string {
  if (level === "High")
    return "bg-[#C0504D]/12 text-[#C0504D] border-[#C0504D]/30";
  if (level === "Moderate")
    return "bg-[#E3A21A]/15 text-[#9A6B08] border-[#E3A21A]/40";
  return "bg-[#2E8B57]/12 text-[#2E8B57] border-[#2E8B57]/30";
}

export default function PatientProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1140px] px-5 py-20 text-center text-muted-foreground">
          Loading patient clinical profile...
        </div>
      }
    >
      <PatientProfileContent />
    </Suspense>
  );
}

function PatientProfileContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const patientId = params?.id ?? "";
  const { user } = useAuth();

  const [, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Open visit composer automatically when arriving with ?visit=new
  const [showAddVisit, setShowAddVisit] = useState(false);
  useEffect(() => {
    if (searchParams?.get("visit") === "new") {
      setShowAddVisit(true);
    }
  }, [searchParams]);

  // Record file opened for "Recently opened files" on Dashboard
  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "doctor") && patientId) {
      try {
        recordPatientFileOpened(user, patientId);
      } catch {
        // ignore
      }
    }
  }, [user, patientId]);

  const canRead =
    user && (user.role === "admin" || user.role === "doctor");

  const patient = canRead ? getPatientRecordById(user, patientId) : undefined;
  const visits = canRead ? listVisitsForPatient(user, patientId) : [];
  const latestVisit = visits.length > 0 ? visits[visits.length - 1] : undefined;

  const medicalLists = getMedicalLists();
  const labRanges = getLabRanges();

  // Editable personal info + recorded diagnosis state
  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<"Female" | "Male">("Female");
  const [editDob, setEditDob] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHistory, setEditHistory] = useState("");
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  useEffect(() => {
    if (patient) {
      setEditName(patient.fullName);
      setEditGender(patient.gender);
      setEditDob(patient.dob);
      setEditPhone(patient.phone);
      setEditHistory(patient.historySummary);
      setDiagnosisInput(patient.recordedDiagnosis);
    }
  }, [patient]);

  // New Visit Composer state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [labStrings, setLabStrings] = useState<Record<string, string>>({});
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([
    "Chest X-ray",
    "ACE",
  ]);
  const [visitNotes, setVisitNotes] = useState("");

  // Dynamic symptom groups from medicalLists (falling back to model.features)
  const symptomFeatures = useMemo(() => {
    const customSymptoms = medicalLists.filter((m) => m.category === "symptom");
    if (customSymptoms.length === 0) return model.features;
    return customSymptoms.map((s) => {
      const base = model.features.find((f) => f.id === s.code);
      return {
        id: s.code,
        label: s.name,
        group: s.groupName || base?.group || "General",
        points: s.points ?? base?.points ?? 0,
        pct_sarcoidosis: base?.pct_sarcoidosis ?? null,
        pct_other: base?.pct_other ?? null,
      };
    });
  }, [medicalLists]);

  const groupedFeatures = useMemo(() => {
    const groupsMap = new Map<string, typeof symptomFeatures>();
    for (const f of symptomFeatures) {
      const existing = groupsMap.get(f.group) ?? [];
      existing.push(f);
      groupsMap.set(f.group, existing);
    }
    const ordered: { groupName: string; features: typeof symptomFeatures }[] = [];
    const seen = new Set<string>();
    for (const g of PREFERRED_GROUP_ORDER) {
      if (groupsMap.has(g)) {
        ordered.push({ groupName: g, features: groupsMap.get(g)! });
        seen.add(g);
      }
    }
    for (const [name, feats] of groupsMap.entries()) {
      if (!seen.has(name)) {
        ordered.push({ groupName: name, features: feats });
      }
    }
    return ordered;
  }, [symptomFeatures]);

  const numericLabs = useMemo(() => {
    const record: Record<string, number | undefined> = {};
    for (const [id, raw] of Object.entries(labStrings)) {
      if (raw.trim() === "") {
        record[id] = undefined;
      } else {
        const parsed = Number.parseFloat(raw);
        record[id] = Number.isNaN(parsed) ? undefined : parsed;
      }
    }
    return record;
  }, [labStrings]);

  const liveEvaluation = useMemo(
    () =>
      score(
        { symptoms: selectedSymptoms, labs: numericLabs },
        {
          customFeatures: symptomFeatures.map((f) => ({
            id: f.id,
            label: f.label,
            points: f.points,
          })),
          customLabs: labRanges,
        }
      ),
    [selectedSymptoms, numericLabs, symptomFeatures, labRanges]
  );

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patient) return;
    setErrorNotice(null);
    try {
      updatePatientPersonalAndDiagnosis(user, patient.id, {
        fullName: editName,
        gender: editGender,
        dob: editDob,
        phone: editPhone,
        historySummary: editHistory,
      });
      setEditingInfo(false);
      setSavedNotice("Personal information and medical history updated.");
      triggerRefresh();
    } catch (err) {
      setErrorNotice(
        err instanceof Error
          ? err.message
          : "Could not update personal information."
      );
    }
  };

  const handleSaveDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patient) return;
    setErrorNotice(null);
    try {
      updatePatientPersonalAndDiagnosis(user, patient.id, {
        recordedDiagnosis: diagnosisInput,
      });
      setSavedNotice("Doctor-recorded diagnosis saved to patient record.");
      triggerRefresh();
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : "Could not save diagnosis."
      );
    }
  };

  const handleSaveVisit = () => {
    if (!user || !patient || isSavingVisit) return;
    setIsSavingVisit(true);
    setErrorNotice(null);
    try {
      addClinicalVisit(user, {
        patientId: patient.id,
        symptoms: selectedSymptoms,
        labs: numericLabs,
        investigations: selectedInvestigations,
        clinicalNotes:
          visitNotes.trim() ||
          "Clinical evaluation recorded via SarcoScore checker.",
      });
      setShowAddVisit(false);
      setSelectedSymptoms([]);
      setLabStrings({});
      setVisitNotes("");
      setSavedNotice(
        `New clinical visit saved with model version ${model.version}.`
      );
      triggerRefresh();
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : "Could not save clinical visit."
      );
    } finally {
      setIsSavingVisit(false);
    }
  };

  const latestEvalBreakdown = useMemo(() => {
    if (!latestVisit) return null;
    return score(
      {
        symptoms: latestVisit.symptoms,
        labs: latestVisit.labs,
      },
      {
        customFeatures: symptomFeatures.map((f) => ({
          id: f.id,
          label: f.label,
          points: f.points,
        })),
        customLabs: labRanges,
      }
    );
  }, [latestVisit, symptomFeatures, labRanges]);

  const chartData = useMemo(() => {
    return visits.map((v, idx) => ({
      visitLabel: `Visit ${idx + 1} (${v.date.slice(0, 10)})`,
      pct: Math.round(v.probability * 100),
      total: v.total,
      level: v.level,
    }));
  }, [visits]);

  const investigationOptions = useMemo(
    () =>
      medicalLists
        .filter((m) => m.category === "investigation")
        .map((m) => m.name),
    [medicalLists]
  );

  return (
    <RoleGuard feature="patient_profile" featureTitle="Patient Profile">
      <div className="mx-auto max-w-[1140px] px-5 py-10 md:px-10 md:py-16 lg:px-16">
        {!patient ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="font-serif text-2xl font-medium text-foreground mb-2">
              Patient file not found
            </h1>
            <p className="text-[15px] text-muted-foreground mb-5">
              No patient file exists for internal ID{" "}
              <code className="font-mono">{patientId}</code>.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Navigation & Status Notice */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-foreground hover:bg-background transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/cases/new"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-foreground hover:bg-background transition-colors"
                >
                  <span>Create &amp; Review</span>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setShowAddVisit((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>
                  {showAddVisit
                    ? "Close Visit Scorer"
                    : "Add clinical visit"}
                </span>
              </button>
            </div>

            {errorNotice && (
              <div className="flex items-center justify-between rounded-xl border border-[#C0504D]/40 bg-[#C0504D]/10 px-4 py-3 text-[14px] text-[#C0504D]">
                <div className="flex items-center gap-2">
                  <span>{errorNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorNotice(null)}
                  className="text-[12px] font-semibold underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {savedNotice && (
              <div className="flex items-center justify-between rounded-xl border border-[#2E8B57]/40 bg-[#2E8B57]/10 px-4 py-3 text-[14px] text-[#2E8B57]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{savedNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSavedNotice(null)}
                  className="text-[12px] font-semibold underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* 1. OVERVIEW WITH EDITABLE PERSONAL INFO + MEDICAL HISTORY SUMMARY */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-mockup"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-border">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-md bg-primary/12 px-2.5 py-0.5 font-mono text-[12px] font-semibold text-primary">
                      {patient.patientCode}
                    </span>
                    <span className="rounded-md border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Internal Route ID: {patientId}
                    </span>
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground">
                    {patient.fullName}
                  </h1>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    {`${patient.gender} · DOB: ${patient.dob} · Phone: ${patient.phone} · Fake National ID: ${patient.nationalId}`}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingInfo((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-medium text-foreground hover:bg-card transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {editingInfo ? "Cancel Edit" : "Edit Personal Info"}
                    </span>
                  </button>
                </div>
              </div>

              {editingInfo ? (
                <form
                  onSubmit={handleSavePersonalInfo}
                  className="mt-5 space-y-4 rounded-xl border border-border bg-background p-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[13px] font-semibold text-foreground mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-foreground mb-1">
                        Gender
                      </label>
                      <select
                        value={editGender}
                        onChange={(e) =>
                          setEditGender(e.target.value as "Female" | "Male")
                        }
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] text-foreground"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-foreground mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-foreground mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-[14px] text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-foreground mb-1">
                      Medical History Summary
                    </label>
                    <textarea
                      rows={3}
                      value={editHistory}
                      onChange={(e) => setEditHistory(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] text-foreground"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Personal Info &amp; History</span>
                  </button>
                </form>
              ) : (
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Medical History Summary */}
                  <div className="lg:col-span-7 rounded-xl border border-border bg-background p-5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1.5">
                      Medical History Summary
                    </span>
                    <p className="text-[16px] leading-relaxed text-foreground/90">
                      {patient.historySummary}
                    </p>
                  </div>

                  {/* Recorded Diagnosis (Typed by Doctor) */}
                  <form
                    onSubmit={handleSaveDiagnosis}
                    className="lg:col-span-5 rounded-xl border border-border bg-background p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-primary mb-1.5">
                        <Stethoscope className="h-4 w-4" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                          Recorded Diagnosis (Doctor-Entered)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={diagnosisInput}
                        onChange={(e) => setDiagnosisInput(e.target.value)}
                        placeholder="Enter confirmed or working clinical diagnosis..."
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3.5 py-2 text-[15px] font-medium text-foreground focus:border-primary focus:outline-none"
                      />
                      <span className="mt-1.5 block text-[11px] text-muted-foreground">
                        Entered by the physician. The scoring tool provides
                        likelihood only and never diagnoses.
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="mt-3 self-start inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Update Recorded Diagnosis</span>
                    </button>
                  </form>
                </div>
              )}
            </motion.section>

            {/* INTERACTIVE "ADD CLINICAL VISIT" SCORER (When open) */}
            {showAddVisit && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-primary/40 bg-card p-6 md:p-8 shadow-mockup"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      New Clinical Visit · Model v{model.version}
                    </span>
                    <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">
                      Enter Symptoms, Investigations &amp; Lab Results
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveVisit}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Clinical Visit &amp; Score</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-5">
                    {groupedFeatures.map(({ groupName, features }) => (
                      <SymptomGroup
                        key={groupName}
                        groupName={groupName}
                        features={features}
                        selectedIds={selectedSymptoms}
                        onToggle={(id) =>
                          setSelectedSymptoms((prev) =>
                            prev.includes(id)
                              ? prev.filter((x) => x !== id)
                              : [...prev, id]
                          )
                        }
                      />
                    ))}

                    {/* Quantitative Lab Inputs */}
                    <div className="rounded-xl border border-border bg-background/80 p-5">
                      <h3 className="font-serif text-xl font-medium text-foreground mb-1">
                        Laboratory Tests (Quantitative)
                      </h3>
                      <p className="text-[13px] text-muted-foreground mb-4">
                        Scored against normal ranges configured in System
                        Management.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {labRanges.map((lab) => (
                          <LabInput
                            key={lab.id}
                            lab={lab}
                            rawValue={labStrings[lab.id] ?? ""}
                            onChange={(id, val) =>
                              setLabStrings((prev) => ({ ...prev, [id]: val }))
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Ordered Investigations & Clinical Visit Notes */}
                    <div className="rounded-xl border border-border bg-background/80 p-5 space-y-4">
                      <div>
                        <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                          Investigations Ordered / Reviewed
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {investigationOptions.map((inv) => {
                            const active = selectedInvestigations.includes(inv);
                            return (
                              <button
                                key={inv}
                                type="button"
                                onClick={() =>
                                  setSelectedInvestigations((prev) =>
                                    prev.includes(inv)
                                      ? prev.filter((x) => x !== inv)
                                      : [...prev, inv]
                                  )
                                }
                                className={cn(
                                  "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground hover:border-primary/40"
                                )}
                              >
                                {inv}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[14px] font-semibold text-foreground mb-1">
                          Clinical Visit Notes
                        </label>
                        <textarea
                          rows={2}
                          value={visitNotes}
                          onChange={(e) => setVisitNotes(e.target.value)}
                          placeholder="Summary of clinical assessment or biopsy plan..."
                          className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-[14px] text-foreground"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveVisit}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Clinical Visit to Patient File</span>
                      </button>
                    </div>
                  </div>

                  {/* Sticky Live Result Card */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24">
                    <ResultCard
                      total={liveEvaluation.total}
                      probability={liveEvaluation.probability}
                      level={liveEvaluation.level}
                      items={liveEvaluation.items}
                      onClearAll={() => {
                        setSelectedSymptoms([]);
                        setLabStrings({});
                      }}
                    />
                  </div>
                </div>
              </motion.section>
            )}

            {/* 2. CURRENT SYMPTOMS, LATEST INVESTIGATIONS & LATEST SCORE RESULT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Cols: Current Symptoms from Last Visit + Latest Investigations & Lab Tests */}
              <div className="lg:col-span-7 space-y-6">
                {/* Current Symptoms from the Last Visit */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                          Latest Clinical Visit
                        </span>
                        <h2 className="font-serif text-xl font-medium text-foreground">
                          Current Symptoms from Last Visit
                        </h2>
                      </div>
                    </div>
                    {latestVisit && (
                      <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {latestVisit.date.slice(0, 10)}
                      </span>
                    )}
                  </div>

                  {!latestVisit || latestVisit.symptoms.length === 0 ? (
                    <p className="text-[15px] text-muted-foreground">
                      No symptoms recorded yet. Click{" "}
                      <strong>Add clinical visit</strong> to record presenting
                      symptoms.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {latestVisit.symptoms.map((symId) => {
                        const feat = symptomFeatures.find((f) => f.id === symId);
                        const label = feat?.label ?? symId;
                        const pts = feat?.points ?? 0;
                        return (
                          <div
                            key={symId}
                            className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5 text-[14px]"
                          >
                            <span className="font-medium text-foreground">
                              {label}
                            </span>
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[12px] font-semibold tabular-nums",
                                pts > 0
                                  ? "bg-[#2E6DA4]/12 text-[#2E6DA4]"
                                  : pts < 0
                                  ? "bg-[#C0504D]/12 text-[#C0504D]"
                                  : "bg-border/60 text-muted-foreground"
                              )}
                            >
                              {pts > 0 ? `+${pts}` : pts}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Latest Investigations and Laboratory Tests */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        Diagnostic Workup
                      </span>
                      <h2 className="font-serif text-xl font-medium text-foreground">
                        Latest Investigations and Tests
                      </h2>
                    </div>
                  </div>

                  {!latestVisit ? (
                    <p className="text-[15px] text-muted-foreground">
                      No investigations or laboratory tests recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Investigations badges */}
                      <div>
                        <span className="block text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Investigations Performed
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {latestVisit.investigations.map((inv) => (
                            <span
                              key={inv}
                              className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1 text-[13px] font-medium text-foreground"
                            >
                              {inv}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Quantitative Labs */}
                      <div>
                        <span className="block text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Laboratory Results
                        </span>
                        {Object.keys(latestVisit.labs).length === 0 ? (
                          <p className="text-[14px] text-muted-foreground">
                            No quantitative labs entered on the last visit.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {Object.entries(latestVisit.labs).map(
                              ([labId, val]) => {
                                if (val === undefined || val === null)
                                  return null;
                                const labDef = labRanges.find(
                                  (l) => l.id === labId
                                );
                                return (
                                  <div
                                    key={labId}
                                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5 text-[14px]"
                                  >
                                    <div>
                                      <span className="font-semibold text-foreground">
                                        {labDef?.label ?? labId}
                                      </span>
                                      {labDef && (
                                        <span className="block text-[11px] text-muted-foreground">
                                          Normal: {labDef.low}–{labDef.high}{" "}
                                          {labDef.unit}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono font-semibold text-foreground">
                                      {val} {labDef?.unit ?? ""}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>

                      {latestVisit.clinicalNotes && (
                        <div className="rounded-xl border border-border bg-background p-3.5 text-[14px] text-foreground/90">
                          <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
                            Visit Clinical Notes ({latestVisit.doctorName})
                          </span>
                          {latestVisit.clinicalNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right 5 Cols: Latest Score Result Card */}
              <div className="lg:col-span-5">
                {latestVisit && latestEvalBreakdown ? (
                  <ResultCard
                    total={latestVisit.total}
                    probability={latestVisit.probability}
                    level={latestVisit.level}
                    items={latestEvalBreakdown.items}
                    onClearAll={() => setShowAddVisit(true)}
                  />
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <Activity className="mx-auto h-8 w-8 text-primary mb-2" />
                    <h3 className="font-serif text-xl font-medium text-foreground mb-1">
                      No Visit Score Recorded Yet
                    </h3>
                    <p className="text-[14px] text-muted-foreground mb-4">
                      Add a clinical visit to calculate and store this
                      patient&apos;s sarcoidosis likelihood score.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddVisit(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Add Clinical Visit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. SCORE HISTORY & COMPARISON BETWEEN VISITS (CHART + TABLE) */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Longitudinal Tracking
                    </span>
                    <h2 className="font-serif text-2xl font-medium text-foreground">
                      Score History &amp; Visit-to-Visit Comparison (
                      {visits.length} {visits.length === 1 ? "Visit" : "Visits"}
                      )
                    </h2>
                  </div>
                </div>
                <span className="text-[12px] text-muted-foreground">
                  Decision support only. Confirm with a specialist and biopsy.
                </span>
              </div>

              {visits.length > 0 && (
                <div className="mb-8 h-[260px] w-full rounded-xl border border-border bg-background p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#DFD9C8" />
                      <XAxis
                        dataKey="visitLabel"
                        tick={{ fill: "#22302E", fontSize: 12 }}
                        stroke="#DFD9C8"
                      />
                      <YAxis
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fill: "#6B7876", fontSize: 12 }}
                        stroke="#DFD9C8"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#F7F4EC",
                          borderColor: "#DFD9C8",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                        formatter={(value: number) => [
                          `${value}% likelihood`,
                          "Sarcoidosis Score",
                        ]}
                      />
                      <ReferenceLine
                        y={60}
                        stroke="#C0504D"
                        strokeDasharray="4 4"
                        label={{
                          value: "High (60%)",
                          fill: "#C0504D",
                          fontSize: 11,
                        }}
                      />
                      <ReferenceLine
                        y={30}
                        stroke="#E3A21A"
                        strokeDasharray="4 4"
                        label={{
                          value: "Moderate (30%)",
                          fill: "#9A6B08",
                          fontSize: 11,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pct"
                        stroke="hsl(158, 30%, 27%)"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "hsl(158, 30%, 27%)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Visit Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full text-left border-collapse text-[14px]">
                  <thead>
                    <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Visit / Date</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Findings &amp; Labs</th>
                      <th className="py-3 px-4 text-right">Total Points</th>
                      <th className="py-3 px-4 text-right">Likelihood %</th>
                      <th className="py-3 px-4 text-center">Level</th>
                      <th className="py-3 px-4 text-right">Comparison (Δ)</th>
                      <th className="py-3 px-4 text-right">Model Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visits.map((v, idx) => {
                      const pct = Math.round(v.probability * 100);
                      const prevPct =
                        idx > 0
                          ? Math.round(visits[idx - 1].probability * 100)
                          : null;
                      const delta = prevPct !== null ? pct - prevPct : null;
                      return (
                        <tr key={v.id} className="hover:bg-card/40">
                          <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                            Visit #{idx + 1} · {v.date.slice(0, 10)}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {v.doctorName}
                          </td>
                          <td className="py-3 px-4 text-[13px] text-foreground">
                            {v.symptoms.length} finding
                            {v.symptoms.length === 1 ? "" : "s"},{" "}
                            {Object.keys(v.labs).length} lab
                            {Object.keys(v.labs).length === 1 ? "" : "s"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                            {v.total > 0 ? `+${v.total}` : v.total}
                          </td>
                          <td
                            className="py-3 px-4 text-right font-serif text-lg font-semibold tabular-nums"
                            style={{ color: levelColorHex(v.level) }}
                          >
                            {pct}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                levelBadgeClasses(v.level)
                              )}
                            >
                              {v.level}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[13px]">
                            {delta === null ? (
                              <span className="text-muted-foreground">
                                Baseline
                              </span>
                            ) : delta > 0 ? (
                              <span className="font-semibold text-[#C0504D]">
                                +{delta}%
                              </span>
                            ) : delta < 0 ? (
                              <span className="font-semibold text-[#2E8B57]">
                                {delta}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0%</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[12px] text-muted-foreground">
                            {v.modelVersion}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
