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
  updateImportedCaseStatus,
  listResearchPatientCases,
} from "@/lib/db";
import model from "@/data/model.json";
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

const FREQUENT_EXAMINATIONS_DATA = [
  { exam: "Chest CT / HRCT", count: 24, displayLabel: "24 of 30" },
  { exam: "Tissue Biopsy (Granulomas)", count: 22, displayLabel: "22 of 30" },
  { exam: "Chest X-ray", count: 21, displayLabel: "21 of 30" },
  { exam: "Serum ACE Level", count: 19, displayLabel: "19 of 30" },
  { exam: "CRP & ESR", count: 18, displayLabel: "18 of 30" },
  { exam: "CBC & Lymphocyte Count", count: 17, displayLabel: "17 of 30" },
  { exam: "Serum Calcium & ALP", count: 15, displayLabel: "15 of 30" },
  { exam: "ECG / Echocardiogram / CMR", count: 11, displayLabel: "11 of 30" },
  { exam: "TB Gold / TST Rule-out", count: 10, displayLabel: "10 of 30" },
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

export default function ResearchPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"model_insights" | "patient_case">(
    "model_insights"
  );
  const [sourceFilter, setSourceFilter] = useState<
    "ALL" | "Clinic Visit" | "Pending Import"
  >("ALL");

  // Upload form state
  const [fileName, setFileName] = useState(
    "pubmed_sarcoidosis_cases_batch2.xlsx"
  );
  const [fileType, setFileType] = useState<"Excel" | "PDF">("Excel");
  const [caseCode, setCaseCode] = useState("LIT-2026-33");
  const [age, setAge] = useState("48");
  const [gender, setGender] = useState<"Female" | "Male">("Female");
  const [source, setSource] = useState("PubMed Case Report");
  const [confirmedDisease, setConfirmedDisease] = useState("Sarcoidosis");
  const [diagMonths, setDiagMonths] = useState("6");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "imaging_enlarged_chest_lymph_nodes",
    "dry_cough",
  ]);
  const [investigationsText, setInvestigationsText] = useState(
    "Chest CT, Serum ACE, Transbronchial Biopsy"
  );
  const [fileSizeBytes, setFileSizeBytes] = useState<number | undefined>(
    undefined
  );
  const [magicBytes, setMagicBytes] = useState<Uint8Array | undefined>(
    undefined
  );
  const [stagedLocalFile, setStagedLocalFile] = useState<string | null>(null);
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
    setFileName(file.name);
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
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".pdf")) {
      setFileType("PDF");
    } else {
      setFileType("Excel");
    }
    const nextNum = importedCases.length + 31;
    setCaseCode(`LIT-2026-${nextNum}`);
  };

  const handleSubmitImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const created = submitImportedResearchCase(user, {
        fileName: fileName.trim() || "imported_cases.xlsx",
        fileType,
        fileSizeBytes,
        magicBytes,
        caseCode:
          caseCode.trim() || `LIT-${Date.now().toString(36).slice(-4)}`,
        age: Number.parseInt(age, 10) || 45,
        gender,
        source: source.trim() || "PubMed",
        symptoms: selectedSymptoms,
        investigations: investigationsText.trim() || "Chest CT, ACE",
        confirmedDisease: confirmedDisease.trim() || "Sarcoidosis",
        diagnosticTimeMonths: Number.parseInt(diagMonths, 10) || 6,
      });
      setLastUploadedId(created.id);
      setStagedLocalFile(null);
      setNotice(
          `Uploaded "${created.fileName}" (${created.caseSummary.caseCode})! It is now at the top of "Imported Cases Pending Review" on the right and in the "Patient Case Page" tab.`
      );
      const nextNum = importedCases.length + 32;
      setCaseCode(`LIT-2026-${nextNum}`);
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

  const handleStatusChange = (
    id: string,
    nextStatus: "pending" | "approved" | "rejected"
  ) => {
    if (!user) return;
    updateImportedCaseStatus(user, id, nextStatus);
    setNotice(`Updated imported case status to "${nextStatus}".`);
    refresh();
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
      String(c.age),
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
              Upload new published or clinical cases via Excel or PDF into the
              pending review queue, explore frequent symptoms and examinations
              across the {model.stats.total_cases}-case dataset, and inspect
              de-identified patient cases.
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
                {/* 1A. Upload Excel / PDF Case + Pending Review Queue */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Upload Excel / PDF Form */}
                  <motion.section
                    {...fadeUp}
                    className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 md:p-7"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <Upload className="h-5 w-5 text-primary" />
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                          Add New Cases
                        </span>
                        <h2 className="font-serif text-xl font-medium text-foreground">
                          Upload Excel or PDF Case File
                        </h2>
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-[#E3A21A]/45 bg-[#E3A21A]/10 p-3.5 text-[13px] text-foreground/90 flex items-start gap-2.5">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-[#9A6B08] mt-0.5" />
                      <span>
                        Imported cases go to the{" "}
                        <strong>pending review queue</strong> and never change live
                        scoring automatically.
                      </span>
                    </div>

                    <form onSubmit={handleSubmitImport} className="space-y-3.5">
                      <div>
                        <label className="block text-[13px] font-semibold text-foreground mb-1">
                          Select Excel (.xlsx / .csv) or PDF (.pdf) File
                        </label>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv,.pdf"
                          onChange={handleFileInputChange}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground"
                        />
                        {stagedLocalFile && (
                          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-[12px] text-primary">
                            <span>
                              Selected: <strong>{stagedLocalFile}</strong>
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-semibold text-foreground mb-1">
                            File Name
                          </label>
                          <input
                            type="text"
                            required
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-foreground mb-1">
                            Format
                          </label>
                          <select
                            value={fileType}
                            onChange={(e) =>
                              setFileType(e.target.value as "Excel" | "PDF")
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                          >
                            <option value="Excel">Excel (.xlsx / .csv)</option>
                            <option value="PDF">PDF Document (.pdf)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[12px] font-semibold text-foreground mb-1">
                            Case Code
                          </label>
                          <input
                            type="text"
                            required
                            value={caseCode}
                            onChange={(e) => setCaseCode(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-foreground mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-foreground mb-1">
                            Gender
                          </label>
                          <select
                            value={gender}
                            onChange={(e) =>
                              setGender(e.target.value as "Female" | "Male")
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-semibold text-foreground mb-1">
                            Confirmed Disease
                          </label>
                          <input
                            type="text"
                            required
                            value={confirmedDisease}
                            onChange={(e) => setConfirmedDisease(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-foreground mb-1">
                            Time to Diagnosis (mo)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={diagMonths}
                            onChange={(e) => setDiagMonths(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-foreground mb-1">
                          Presenting Symptoms (Click to toggle)
                        </label>
                        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background p-2">
                          {model.features.slice(0, 12).map((f) => {
                            const active = selectedSymptoms.includes(f.id);
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() =>
                                  setSelectedSymptoms((prev) =>
                                    prev.includes(f.id)
                                      ? prev.filter((x) => x !== f.id)
                                      : [...prev, f.id]
                                  )
                                }
                                className={cn(
                                  "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                                  active
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-foreground border border-border"
                                )}
                              >
                                {f.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-foreground mb-1">
                          Investigations Summary
                        </label>
                        <input
                          type="text"
                          value={investigationsText}
                          onChange={(e) => setInvestigationsText(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload Case to Pending Review Queue</span>
                      </button>
                    </form>
                  </motion.section>

                  {/* Pending Review Queue */}
                  <motion.section
                    {...fadeUp}
                    className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 md:p-7"
                  >
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                            Review Queue · Isolated from Live Model
                          </span>
                          <h2 className="font-serif text-xl font-medium text-foreground">
                            Imported Cases Pending Review ({importedCases.length})
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
                              ) : (
                                <FileText className="h-4 w-4 text-[#2E6DA4]" />
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
                                  New Upload
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
                              {imp.status}
                            </span>
                          </div>

                          <p className="text-[13px] text-foreground/90">
                            <strong>Confirmed Disease:</strong>{" "}
                            {imp.caseSummary.confirmedDisease} ·{" "}
                            <strong>Demographics:</strong> {imp.caseSummary.gender},{" "}
                            {imp.caseSummary.age} yrs ·{" "}
                            <strong>Diagnostic Time:</strong>{" "}
                            {imp.caseSummary.diagnosticTimeMonths} mo
                          </p>
                          <p className="text-[12px] text-muted-foreground mt-1">
                            <strong>Investigations:</strong>{" "}
                            {imp.caseSummary.investigations} · Uploaded by{" "}
                            {imp.uploadedByEmail}
                          </p>

                          {user?.role === "admin" && (
                            <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase text-muted-foreground mr-1">
                                Admin Review:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(imp.id, "approved")}
                                className="rounded-md bg-[#2E8B57]/15 px-2.5 py-1 text-[11px] font-semibold text-[#2E8B57] hover:bg-[#2E8B57]/25"
                              >
                                Approve for Next Model Build
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(imp.id, "rejected")}
                                className="rounded-md bg-[#C0504D]/12 px-2.5 py-1 text-[11px] font-semibold text-[#C0504D] hover:bg-[#C0504D]/25"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(imp.id, "pending")}
                                className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
                              >
                                Reset Pending
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
                      performed across the 30-case sample.
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
                            domain={[0, 30]}
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
                            {c.age} yrs · {c.gender}
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
                            {c.investigations.join(", ") || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-[13px] font-medium text-foreground max-w-[200px]">
                            {c.diagnosis}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <span
                                className="font-serif text-lg font-semibold tabular-nums"
                                style={{ color: levelColorHex(c.level) }}
                              >
                                {c.scorePct}%
                              </span>
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                  levelBadgeClasses(c.level)
                                )}
                              >
                                {c.level}
                              </span>
                            </div>
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
