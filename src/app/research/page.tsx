"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import {
  listImportedCases,
  submitImportedResearchCase,
  submitManualResearchCase,
  updateImportedCaseStatus,
  listResearchPatientCases,
  getMedicalLists,
  getLabRanges,
} from "@/lib/db";
import model from "@/data/model.json";
import publishedCasesData from "@/data/publishedCases.json";
import {
  MostFrequentChart,
  PointsPerFindingChart,
  AgeGroupsChart,
  DiagnosticTimeChart,
} from "@/components/charts/InsightsCharts";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  ClipboardEdit,
  Clock,
  CheckCircle2,
  BarChart3,
  Database,
  Download,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

const PREFERRED_GROUP_ORDER = [
  "General",
  "Chest",
  "Skin, nose & mouth",
  "Skin nose & mouth",
  "Abdomen",
  "Other",
  "Imaging & tests",
];

const FREQUENT_EXAMINATIONS_DATA =
  publishedCasesData.examinationFrequencies.slice(0, 10);

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

export default function ResearchPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"model_insights" | "patient_case">(
    "model_insights"
  );
  const [addCaseMethod, setAddCaseMethod] = useState<"upload" | "manual">(
    "upload"
  );
  const [sourceFilter, setSourceFilter] = useState<
    "ALL" | "Published Cohort" | "Clinic Visit" | "Pending Import"
  >("ALL");

  // Option 1: "Upload file" state (Excel or PDF only — no manual fields needed)
  const [uploadFileName, setUploadFileName] = useState("");
  const [fileSizeBytes, setFileSizeBytes] = useState<number | undefined>(
    undefined
  );
  const [magicBytes, setMagicBytes] = useState<Uint8Array | undefined>(
    undefined
  );
  const [stagedLocalFile, setStagedLocalFile] = useState<string | null>(null);

  // Option 2: "Enter manually" state (no file upload needed)
  const [manualCaseCode, setManualCaseCode] = useState(
    `LIT-2026-${model.stats.total_cases + 1}`
  );
  const [manualAge, setManualAge] = useState("48");
  const [manualDiagMonths, setManualDiagMonths] = useState("6");
  const [manualConfirmedDisease, setManualConfirmedDisease] =
    useState("Sarcoidosis");
  const [manualSymptoms, setManualSymptoms] = useState<string[]>([
    "imaging_enlarged_chest_lymph_nodes",
    "dry_cough",
  ]);
  const [manualTestValues, setManualTestValues] = useState<
    Record<string, string>
  >({
    ace: "104 U/L",
    chest_ct: "Bilateral hilar lymphadenopathy",
  });
  const [manualFreeTextTests, setManualFreeTextTests] = useState(
    "Transbronchial biopsy: non-caseating granulomas"
  );

  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    window.addEventListener("sarcoscore-db-updated", refresh);
    return () => window.removeEventListener("sarcoscore-db-updated", refresh);
  }, [refresh]);

  const canRead =
    user && (user.role === "admin" || user.role === "researcher");

  const importedCases = canRead ? listImportedCases(user) : [];
  const researchCases = canRead ? listResearchPatientCases(user) : [];
  const medicalLists = getMedicalLists();
  const labRanges = getLabRanges();

  // Group symptoms as in the Medical lists
  const groupedSymptomItems = useMemo(() => {
    const symptomItems = medicalLists.filter((m) => m.category === "symptom");
    const list =
      symptomItems.length > 0
        ? symptomItems.map((s) => ({
            id: s.code,
            label: s.name,
            group: s.groupName || "General",
          }))
        : model.features.map((f) => ({
            id: f.id,
            label: f.label,
            group: f.group,
          }));

    const groupsMap = new Map<
      string,
      { id: string; label: string; group: string }[]
    >();
    for (const item of list) {
      const existing = groupsMap.get(item.group) ?? [];
      existing.push(item);
      groupsMap.set(item.group, existing);
    }

    const ordered: {
      groupName: string;
      items: { id: string; label: string; group: string }[];
    }[] = [];
    const seen = new Set<string>();
    for (const g of PREFERRED_GROUP_ORDER) {
      if (groupsMap.has(g)) {
        ordered.push({ groupName: g, items: groupsMap.get(g)! });
        seen.add(g);
      }
    }
    for (const [name, items] of groupsMap.entries()) {
      if (!seen.has(name)) {
        ordered.push({ groupName: name, items });
      }
    }
    return ordered;
  }, [medicalLists]);

  const filteredResearchCases = useMemo(() => {
    if (sourceFilter === "ALL") return researchCases;
    return researchCases.filter((c) => c.source === sourceFilter);
  }, [researchCases, sourceFilter]);

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    setUploadFileName(file.name);
    setFileSizeBytes(file.size);
    setStagedLocalFile(
      `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`
    );
    try {
      const buffer = await file.slice(0, 8).arrayBuffer();
      setMagicBytes(new Uint8Array(buffer));
    } catch {
      setMagicBytes(undefined);
    }
  };

  // Submit Option 1: Upload file (Excel or PDF)
  const handleSubmitFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    if (!uploadFileName.trim()) {
      setError("Please select an Excel (.xlsx, .xls, .csv) or PDF (.pdf) file to upload.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const created = submitImportedResearchCase(user, {
        fileName: uploadFileName.trim(),
        fileSizeBytes,
        magicBytes,
      });
      setLastUploadedId(created.id);
      setStagedLocalFile(null);
      setUploadFileName("");
      setFileSizeBytes(undefined);
      setMagicBytes(undefined);
      setNotice(
        `Uploaded "${created.fileName}" (${created.caseSummary.caseCode}) with status "pending review". Live scoring model (${model.version}) remains unchanged until approved.`
      );
      refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload research case file."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Option 2: Enter manually
  const handleSubmitManualCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const combinedTests: Record<string, string> = {};
      for (const [k, v] of Object.entries(manualTestValues)) {
        if (v && v.trim()) {
          combinedTests[k] = v.trim();
        }
      }
      if (manualFreeTextTests.trim()) {
        combinedTests["examinations"] = manualFreeTextTests.trim();
      }

      const created = submitManualResearchCase(user, {
        caseCode: manualCaseCode,
        age: manualAge,
        diagnosticTimeMonths: manualDiagMonths,
        confirmedDisease: manualConfirmedDisease,
        symptoms: manualSymptoms,
        testValues: combinedTests,
      });
      setLastUploadedId(created.id);
      const nextNum = model.stats.total_cases + importedCases.length + 2;
      setManualCaseCode(`LIT-2026-${nextNum}`);
      setNotice(
        `Saved manual case "${created.caseSummary.caseCode}" with status "pending review". Live scoring model (${model.version}) remains unchanged until approved.`
      );
      refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save manual research case."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (
    id: string,
    nextStatus: "pending" | "approved" | "rejected"
  ) => {
    if (!user) return;
    setError(null);
    try {
      updateImportedCaseStatus(user, id, nextStatus);
      setNotice(
        `Updated case review status to "${nextStatus === "pending" ? "pending review" : nextStatus}".`
      );
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update review status."
      );
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Source",
      "Age",
      "Gender",
      "Current_Symptoms",
      "Investigations",
      "Diagnosis",
      "Likelihood_Pct",
      "Level",
    ];
    const rows = filteredResearchCases.map((c) => [
      c.caseCode,
      c.source,
      c.age !== null ? String(c.age) : "",
      c.gender,
      `"${c.symptoms.join("; ")}"`,
      `"${c.investigations.join("; ")}"`,
      `"${c.diagnosis.replace(/"/g, '""')}"`,
      `${c.scorePct}%`,
      c.level,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sarcoscore-research-cases-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGuard feature="research_insights" featureTitle="Research & Insights">
      <div className="mx-auto max-w-[1140px] px-5 py-10 md:px-10 md:py-16 lg:px-16 space-y-8">
        {/* Header */}
        <motion.div
          {...fadeUp}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6"
        >
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
              RESEARCHER &amp; ADMIN WORKSPACE · MODEL v{model.version}
            </span>
            <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
              Research and Insights
            </h1>
            <p className="mt-2 text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
              Add new cases into the pending review queue—either by uploading an
              Excel/PDF file or by entering a case manually—and explore frequent
              symptoms and examinations across the {model.stats.total_cases}
              -case dataset.
            </p>
          </div>

          {/* Two Main Tabs */}
          <div
            role="tablist"
            aria-label="Research & Insights Tabs"
            className="inline-flex rounded-xl border border-border bg-card p-1.5 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "model_insights"}
              onClick={() => setActiveTab("model_insights")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors",
                activeTab === "model_insights"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/75 hover:text-foreground"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Model &amp; Insights</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "patient_case"}
              onClick={() => setActiveTab("patient_case")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors",
                activeTab === "patient_case"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/75 hover:text-foreground"
              )}
            >
              <Database className="h-4 w-4" />
              <span>Patient Case Page ({researchCases.length})</span>
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#C0504D]/40 bg-[#C0504D]/10 px-4 py-3 text-[14px] text-[#C0504D]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[12px] font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {notice && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2E8B57]/40 bg-[#2E8B57]/10 px-4 py-3 text-[14px] text-[#2E8B57]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("Pending Import");
                  setActiveTab("patient_case");
                }}
                className="rounded-lg bg-[#2E8B57] px-3 py-1 text-[12px] font-semibold text-white hover:bg-[#256f45] transition-colors"
              >
                View in Patient Case Page →
              </button>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-[12px] font-semibold underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 1: MODEL AND INSIGHTS
           =================================================================== */}
        {activeTab === "model_insights" && (
          <div className="space-y-10">
            {/* 1A. Add New Case (One Method OR the Other) + Pending Review Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (6 cols): Add New Case — Two Tabs: "Upload file" OR "Enter manually" */}
              <motion.section
                {...fadeUp}
                className="lg:col-span-6 rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <Upload className="h-5 w-5 text-primary" />
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        Add New Case · Choose One Method
                      </span>
                      <h2 className="font-serif text-xl font-medium text-foreground">
                        Add New Case
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-xl border border-[#E3A21A]/45 bg-[#E3A21A]/10 p-3.5 text-[13px] text-foreground/90 flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-[#9A6B08] mt-0.5" />
                  <span>
                    Use <strong>either</strong> file upload <strong>or</strong>{" "}
                    manual entry. Both save the case with status{" "}
                    <strong>pending review</strong> and never change live
                    scoring automatically. Only an Admin or Researcher approval
                    moves it forward.
                  </span>
                </div>

                {/* Method Switch Tabs: "Upload file" OR "Enter manually" */}
                <div
                  role="tablist"
                  aria-label="Add new case method"
                  className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-1.5 mb-5"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={addCaseMethod === "upload"}
                    onClick={() => {
                      setAddCaseMethod("upload");
                      setError(null);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-[13px] font-semibold transition-colors",
                      addCaseMethod === "upload"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/75 hover:text-foreground"
                    )}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload file</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={addCaseMethod === "manual"}
                    onClick={() => {
                      setAddCaseMethod("manual");
                      setError(null);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-[13px] font-semibold transition-colors",
                      addCaseMethod === "manual"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/75 hover:text-foreground"
                    )}
                  >
                    <ClipboardEdit className="h-4 w-4" />
                    <span>Enter manually</span>
                  </button>
                </div>

                {addCaseMethod === "upload" ? (
                  /* METHOD 1: UPLOAD FILE (Excel or PDF only — no manual fields required) */
                  <form onSubmit={handleSubmitFileUpload} className="space-y-4">
                    <div className="rounded-xl border border-dashed border-border bg-background p-4">
                      <label
                        htmlFor="research-file-upload"
                        className="block text-[13px] font-semibold text-foreground mb-1.5"
                      >
                        Select Excel (.xlsx, .xls, .csv) or PDF (.pdf) File *
                      </label>
                      <input
                        id="research-file-upload"
                        type="file"
                        accept=".xlsx,.xls,.csv,.pdf"
                        onChange={handleFileInputChange}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground"
                      />
                      <span className="mt-2 block text-[12px] text-muted-foreground">
                        Max file size: 5 MB. File type and binary signature
                        (%PDF / OOXML) are verified on the server; file content
                        is never executed.
                      </span>

                      {stagedLocalFile && (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-[12px] text-primary">
                          <span>
                            Ready to upload: <strong>{stagedLocalFile}</strong>
                          </span>
                          <button
                            type="submit"
                            className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                          >
                            Upload Now
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload File to Pending Review</span>
                    </button>
                  </form>
                ) : (
                  /* METHOD 2: ENTER MANUALLY (No file upload required) */
                  <form onSubmit={handleSubmitManualCase} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="manual-case-number"
                          className="block text-[12px] font-semibold text-foreground mb-1"
                        >
                          Case number *
                        </label>
                        <input
                          id="manual-case-number"
                          type="text"
                          required
                          value={manualCaseCode}
                          onChange={(e) => setManualCaseCode(e.target.value)}
                          placeholder="e.g., LIT-2026-33"
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="manual-age"
                          className="block text-[12px] font-semibold text-foreground mb-1"
                        >
                          Age (years) *
                        </label>
                        <input
                          id="manual-age"
                          type="number"
                          min={0}
                          max={120}
                          required
                          value={manualAge}
                          onChange={(e) => setManualAge(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="manual-diag-time"
                          className="block text-[12px] font-semibold text-foreground mb-1"
                        >
                          Diagnostic time (months) *
                        </label>
                        <input
                          id="manual-diag-time"
                          type="number"
                          min={0}
                          max={600}
                          required
                          value={manualDiagMonths}
                          onChange={(e) => setManualDiagMonths(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="manual-confirmed-disease"
                        className="block text-[12px] font-semibold text-foreground mb-1"
                      >
                        Final confirmed disease *
                      </label>
                      <input
                        id="manual-confirmed-disease"
                        type="text"
                        required
                        value={manualConfirmedDisease}
                        onChange={(e) =>
                          setManualConfirmedDisease(e.target.value)
                        }
                        placeholder="e.g., Sarcoidosis, Tuberculosis, Hodgkin's lymphoma"
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                      />
                    </div>

                    {/* Symptoms (yes/no checkboxes grouped as in the Medical lists) */}
                    <div>
                      <span className="block text-[12px] font-semibold text-foreground mb-1.5">
                        Symptoms (Yes / No checkboxes grouped as in Medical
                        lists)
                      </span>
                      <div className="space-y-3 rounded-xl border border-border bg-background p-3">
                        {groupedSymptomItems.map(({ groupName, items }) => (
                          <div
                            key={groupName}
                            className="border-b border-border/60 last:border-b-0 pb-2.5 last:pb-0"
                          >
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-primary mb-1.5">
                              {groupName}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {items.map((sym) => {
                                const checked = manualSymptoms.includes(sym.id);
                                return (
                                  <label
                                    key={sym.id}
                                    className={cn(
                                      "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] cursor-pointer transition-colors",
                                      checked
                                        ? "border-primary bg-primary/[0.08] font-medium text-foreground"
                                        : "border-border/70 bg-card/60 text-foreground/85"
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          setManualSymptoms((prev) =>
                                            prev.includes(sym.id)
                                              ? prev.filter((x) => x !== sym.id)
                                              : [...prev, sym.id]
                                          )
                                        }
                                        className="accent-primary h-3.5 w-3.5"
                                      />
                                      <span>{sym.label}</span>
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                      {checked ? "Yes" : "No"}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Test / examination values (number or free text) */}
                    <div className="space-y-2.5">
                      <span className="block text-[12px] font-semibold text-foreground">
                        Test &amp; examination values (number or free text)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-border bg-background p-3">
                        {labRanges.map((lab) => (
                          <div key={lab.id}>
                            <label className="block text-[11px] font-medium text-muted-foreground mb-0.5">
                              {lab.label} ({lab.unit})
                            </label>
                            <input
                              type="text"
                              value={manualTestValues[lab.id] ?? ""}
                              onChange={(e) =>
                                setManualTestValues((prev) => ({
                                  ...prev,
                                  [lab.id]: e.target.value,
                                }))
                              }
                              placeholder={`Number or text (normal ${lab.low}-${lab.high})`}
                              className="w-full rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] text-foreground"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label
                          htmlFor="manual-free-text-exams"
                          className="block text-[11px] font-medium text-muted-foreground mb-1"
                        >
                          Additional imaging / biopsy / examination findings
                          (free text)
                        </label>
                        <input
                          id="manual-free-text-exams"
                          type="text"
                          value={manualFreeTextTests}
                          onChange={(e) =>
                            setManualFreeTextTests(e.target.value)
                          }
                          placeholder="e.g., Chest CT: bilateral hilar lymphadenopathy; Biopsy: non-caseating granulomas"
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                    >
                      <ClipboardEdit className="h-4 w-4" />
                      <span>Save Manual Case to Pending Review</span>
                    </button>
                  </form>
                )}
              </motion.section>

              {/* Right Column (6 cols): Pending Review Queue */}
              <motion.section
                {...fadeUp}
                className="lg:col-span-6 rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        Review Queue · Isolated from Live Model
                      </span>
                      <h2 className="font-serif text-xl font-medium text-foreground">
                        Cases Pending Review ({importedCases.length})
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {importedCases.map((imp) => (
                    <div
                      key={imp.id}
                      className={cn(
                        "rounded-xl border bg-background p-4 transition-colors",
                        imp.id === lastUploadedId
                          ? "border-[#2E8B57] ring-2 ring-[#2E8B57]/20"
                          : "border-border"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {imp.fileType === "Excel" ? (
                            <FileSpreadsheet className="h-4 w-4 text-[#2E8B57]" />
                          ) : imp.fileType === "PDF" ? (
                            <FileText className="h-4 w-4 text-[#2E6DA4]" />
                          ) : (
                            <ClipboardEdit className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-mono text-[12px] font-semibold text-primary">
                            {imp.caseSummary.caseCode}
                          </span>
                          <span className="text-[14px] font-semibold text-foreground">
                            {imp.fileName}
                          </span>
                          <span className="rounded bg-card px-2 py-0.5 text-[11px] font-medium border border-border">
                            {imp.fileType}
                          </span>
                          {imp.id === lastUploadedId && (
                            <span className="rounded-full bg-[#2E8B57] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              New Case
                            </span>
                          )}
                        </div>

                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                            imp.status === "approved"
                              ? "bg-[#2E8B57]/15 text-[#2E8B57] border-[#2E8B57]/30"
                              : imp.status === "rejected"
                              ? "bg-[#C0504D]/12 text-[#C0504D] border-[#C0504D]/30"
                              : "bg-[#E3A21A]/15 text-[#9A6B08] border-[#E3A21A]/40"
                          )}
                        >
                          {imp.status === "pending"
                            ? "pending review"
                            : imp.status}
                        </span>
                      </div>

                      <p className="text-[13px] text-foreground/90">
                        <strong>Confirmed Disease:</strong>{" "}
                        {imp.caseSummary.confirmedDisease} ·{" "}
                        <strong>Age:</strong> {imp.caseSummary.age} yrs ·{" "}
                        <strong>Diagnostic Time:</strong>{" "}
                        {imp.caseSummary.diagnosticTimeMonths} mo
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-1">
                        <strong>Tests / Examinations:</strong>{" "}
                        {imp.caseSummary.investigations} · Added by{" "}
                        {imp.uploadedByEmail}
                      </p>

                      {(user?.role === "admin" ||
                        user?.role === "researcher") && (
                        <div className="mt-3 pt-2.5 border-t border-border/70 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase text-muted-foreground mr-1">
                            Review Decision:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(imp.id, "approved")
                            }
                            className="rounded-md bg-[#2E8B57]/15 px-2.5 py-1 text-[11px] font-semibold text-[#2E8B57] hover:bg-[#2E8B57]/25"
                          >
                            Approve for Next Model Build
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(imp.id, "rejected")
                            }
                            className="rounded-md bg-[#C0504D]/12 px-2.5 py-1 text-[11px] font-semibold text-[#C0504D] hover:bg-[#C0504D]/25"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(imp.id, "pending")
                            }
                            className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
                          >
                            Reset Pending Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* 1B. Charts of Frequent Symptoms and Examinations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Frequent Symptoms in Sarcoidosis */}
              <motion.section
                {...fadeUp}
                className="rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                  Cohort Analysis · Fig. (1) &amp; (3)
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                  Most Frequent Symptoms &amp; Findings
                </h2>
                <p className="text-[14px] text-muted-foreground mb-4">
                  Frequency across {model.stats.sarcoidosis_cases} confirmed
                  sarcoidosis cases in the {model.stats.total_cases}-case
                  dataset.
                </p>
                <MostFrequentChart />
              </motion.section>

              {/* Chart 2: Frequent Examinations & Tests */}
              <motion.section
                {...fadeUp}
                className="rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                  Cohort Analysis · Fig. (2)
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                  Most Frequent Examinations &amp; Tests
                </h2>
                <p className="text-[14px] text-muted-foreground mb-4">
                  Diagnostic imaging, biopsy, cardiac, and laboratory workup
                  performed across the {model.stats.total_cases}-case dataset.
                </p>
                <div className="h-[390px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={FREQUENT_EXAMINATIONS_DATA}
                      layout="vertical"
                      margin={{ top: 8, right: 68, left: 16, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#DFD9C8"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, model.stats.total_cases]}
                        tick={{ fill: "#6B7876", fontSize: 12 }}
                        stroke="#DFD9C8"
                      />
                      <YAxis
                        type="category"
                        dataKey="exam"
                        width={185}
                        tick={{ fill: "#22302E", fontSize: 12 }}
                        stroke="#DFD9C8"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#F7F4EC",
                          borderColor: "#DFD9C8",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#2E6DA4"
                        radius={[0, 6, 6, 0]}
                        barSize={22}
                      >
                        <LabelList
                          dataKey="displayLabel"
                          position="right"
                          style={{
                            fill: "hsl(174, 22%, 12%)",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>
            </div>

            {/* Chart 3: Points per Finding */}
            <motion.section
              {...fadeUp}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                Scoring Weights · Fig. (4)
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                Points Assigned per Finding ({model.features.length} Features)
              </h2>
              <p className="text-[14px] text-muted-foreground mb-4">
                Positive points favor sarcoidosis; negative points favor
                look-alike diseases (such as TB or lymphoma).
              </p>
              <PointsPerFindingChart />
            </motion.section>

            {/* Charts 4 & 5: Age Distribution & Time to Diagnosis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.section
                {...fadeUp}
                className="rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                  Demographics
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                  Age Groups at Presentation
                </h2>
                <p className="text-[14px] text-muted-foreground mb-4">
                  Mean age {model.stats.avg_age} years across the cohort.
                </p>
                <AgeGroupsChart />
              </motion.section>

              <motion.section
                {...fadeUp}
                className="rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                  Diagnostic Delay
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                  Time to Diagnosis per Patient (Months)
                </h2>
                <p className="text-[14px] text-muted-foreground mb-4">
                  Median {model.stats.diagnostic_time_months.median} months ·
                  Max {model.stats.diagnostic_time_months.max} months.
                </p>
                <DiagnosticTimeChart />
              </motion.section>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: PATIENT CASE PAGE (DE-IDENTIFIED RESEARCH TABLE)
           =================================================================== */}
        {activeTab === "patient_case" && (
          <motion.section
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                  De-Identified Research Cohort
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Patient Case Page ({filteredResearchCases.length} Cases)
                </h2>
                <p className="text-[14px] text-muted-foreground">
                  Displays Case ID, Source, Age, Gender, Current Symptoms,
                  Investigations, Diagnosis, and Likelihood Score. Personal
                  identifiers and National IDs are excluded.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "ALL", label: "All" },
                    {
                      id: "Published Cohort",
                      label: `Published Cohort (${publishedCasesData.totalCases})`,
                    },
                    { id: "Pending Import", label: "Research Imports" },
                    { id: "Clinic Visit", label: "Clinic" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSourceFilter(tab.id)}
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                      sourceFilter === tab.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-card"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 text-[13px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Cases (.csv)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Age / Gender</th>
                    <th className="py-3.5 px-4">Current Symptoms</th>
                    <th className="py-3.5 px-4">Investigations</th>
                    <th className="py-3.5 px-4">Diagnosis</th>
                    <th className="py-3.5 px-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResearchCases.map((c) => (
                    <tr key={c.id} className="hover:bg-card/40">
                      <td className="py-3.5 px-4 font-mono text-[13px] font-semibold text-primary whitespace-nowrap">
                        {c.caseCode}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="rounded-md border border-border bg-card px-2.5 py-0.5 text-[12px] font-medium text-foreground">
                          {c.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {c.age !== null ? `${c.age} yrs` : "—"} · {c.gender}
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-foreground max-w-[240px]">
                        {c.symptoms
                          .map(
                            (id) =>
                              model.features.find((f) => f.id === id)?.label ??
                              id
                          )
                          .join(", ") || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-muted-foreground max-w-[220px]">
                        {c.investigations.join(", ")}
                      </td>
                      <td className="py-3.5 px-4 text-[13px] font-medium text-foreground">
                        {c.diagnosis}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className="font-serif text-lg font-semibold tabular-nums mr-2"
                          style={{ color: levelColorHex(c.level) }}
                        >
                          {c.scorePct}%
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            levelBadgeClasses(c.level)
                          )}
                        >
                          {c.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </div>
    </RoleGuard>
  );
}
