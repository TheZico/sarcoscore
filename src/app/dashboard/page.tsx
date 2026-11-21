"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import {
  listPatientsForDashboard,
  listAllVisitsForClinical,
} from "@/lib/db";
import {
  Search,
  AlertTriangle,
  Clock,
  FolderOpen,
  UserPlus,
  ArrowRight,
  Filter,
  PlusCircle,
  X,
  Users,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<
    "ALL" | "High" | "Moderate" | "Low"
  >("ALL");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "Female" | "Male">(
    "ALL"
  );
  const [, setRefreshTick] = useState(0);

  const handleDbRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("sarcoscore-db-updated", handleDbRefresh);
    return () =>
      window.removeEventListener("sarcoscore-db-updated", handleDbRefresh);
  }, [handleDbRefresh]);

  const canRead =
    user && (user.role === "admin" || user.role === "doctor");

  const patients = canRead ? listPatientsForDashboard(user) : [];
  const allVisits = canRead ? listAllVisitsForClinical(user) : [];

  // Enrich each patient with their latest visit score
  const combinedFiles = useMemo(() => {
    return patients.map((p) => {
      const visits = allVisits
        .filter((v) => v.patientId === p.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      const latestVisit = visits[0];
      return {
        id: p.id, // internal route ID (never national_id)
        patientCode: p.patientCode,
        nationalId: p.nationalId,
        displayName: p.fullName,
        gender: p.gender,
        dobOrAge: `DOB ${p.dob}`,
        recordedDiagnosis: p.recordedDiagnosis,
        lastOpenedAt: p.lastOpenedAt,
        createdAt: p.createdAt,
        visitCount: visits.length,
        latestVisit,
        latestPct: latestVisit ? Math.round(latestVisit.probability * 100) : 10,
        latestLevel: latestVisit?.level ?? "Low",
        latestTotal: latestVisit?.total ?? 0,
      };
    });
  }, [patients, allVisits]);

  // 1. High-risk alerts: patients whose latest score level is High
  const highRiskCases = useMemo(() => {
    return combinedFiles
      .filter((item) => item.latestLevel === "High")
      .sort((a, b) => b.latestPct - a.latestPct);
  }, [combinedFiles]);

  // 2. Recently opened files (one-click access)
  const recentlyOpened = useMemo(() => {
    return [...combinedFiles]
      .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))
      .slice(0, 4);
  }, [combinedFiles]);

  // 3. Filtered + searched Latest Patient Files
  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return combinedFiles.filter((item) => {
      if (levelFilter !== "ALL" && item.latestLevel !== levelFilter) {
        return false;
      }
      if (genderFilter !== "ALL" && item.gender !== genderFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.displayName.toLowerCase().includes(q) ||
        item.nationalId.toLowerCase().includes(q) ||
        item.patientCode.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [combinedFiles, searchQuery, levelFilter, genderFilter]);

  return (
    <RoleGuard feature="dashboard" featureTitle="Clinical Dashboard">
      <div className="mx-auto max-w-[1140px] px-5 py-10 md:px-10 md:py-16 lg:px-16 space-y-8">
        {/* Page Header */}
        <motion.div
          {...fadeUp}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6"
        >
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
              CLINICAL WORKSPACE · DOCTOR &amp; ADMIN DASHBOARD
            </span>
            <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
              Clinical Dashboard
            </h1>
            <p className="mt-2 text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
              Search patient records by name, 14-digit National ID, or Patient
              ID, monitor High-likelihood alerts, and jump directly to recently
              opened files.
            </p>
          </div>
          <Link
            href="/cases/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create &amp; Review Case</span>
          </Link>
        </motion.div>

        {/* Summary KPI Strip */}
        <motion.div
          {...fadeUp}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-primary mb-1.5">
              <Users className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                Registered Patients
              </span>
            </div>
            <p className="font-serif text-3xl font-semibold text-foreground tabular-nums">
              {patients.length}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Active patient clinical records
            </p>
          </div>

          <div className="rounded-xl border border-[#C0504D]/35 bg-[#C0504D]/[0.06] p-5">
            <div className="flex items-center gap-2 text-[#C0504D] mb-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                High-Risk Alerts
              </span>
            </div>
            <p className="font-serif text-3xl font-semibold text-[#C0504D] tabular-nums">
              {highRiskCases.length} cases
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Latest likelihood level is High (&ge;60%)
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-primary mb-1.5">
              <Activity className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                Recorded Visits
              </span>
            </div>
            <p className="font-serif text-3xl font-semibold text-foreground tabular-nums">
              {allVisits.length}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Scored with points-based model
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-primary mb-1.5">
              <Clock className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                Recently Opened
              </span>
            </div>
            <p className="font-serif text-3xl font-semibold text-foreground tabular-nums">
              {recentlyOpened.length}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              One-click quick resume below
            </p>
          </div>
        </motion.div>

        {/* 1. HIGH-RISK ALERTS (Patients whose latest score level is High) */}
        <motion.section
          {...fadeUp}
          className="rounded-2xl border border-[#C0504D]/40 bg-[#C0504D]/[0.05] p-6 md:p-7"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C0504D]/15 text-[#C0504D]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C0504D]">
                  Priority Follow-Up · High Likelihood Alerts
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  High-Risk Cases ({highRiskCases.length})
                </h2>
              </div>
            </div>
            <span className="text-[13px] text-muted-foreground">
              Patients whose latest clinical visit returned a{" "}
              <strong className="text-[#C0504D]">High</strong> likelihood score
              (&ge;60%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highRiskCases.map((c) => (
              <Link
                key={c.id}
                href={`/patients/${c.id}`}
                className="group rounded-xl border border-[#C0504D]/30 bg-background p-4 hover:border-[#C0504D] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[12px] font-semibold text-primary">
                      {c.patientCode}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[#C0504D]/35 bg-[#C0504D]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#C0504D]">
                      {c.latestPct}% · {c.latestLevel}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {c.displayName}
                  </h3>
                  <p className="mt-1 text-[13px] text-muted-foreground line-clamp-2">
                    {c.recordedDiagnosis}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">
                    Points:{" "}
                    <strong className="text-foreground">+{c.latestTotal}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <span>Review file</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* 2. RECENTLY OPENED FILES (One-Click Access) */}
        <motion.section
          {...fadeUp}
          className="rounded-2xl border border-border bg-card p-6 md:p-7"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Quick Access
                </span>
                <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground">
                  Recently Opened Files
                </h2>
              </div>
            </div>
            <span className="text-[12px] text-muted-foreground">
              One-click access to recently reviewed records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentlyOpened.map((item) => (
              <Link
                key={item.id}
                href={`/patients/${item.id}`}
                className="rounded-xl border border-border bg-background p-4 hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      {item.patientCode}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        levelBadgeClasses(item.latestLevel)
                      )}
                    >
                      {item.latestPct}% {item.latestLevel}
                    </span>
                  </div>
                  <p className="text-[15px] font-semibold text-foreground truncate">
                    {item.displayName}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {item.gender} · {item.dobOrAge}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Opened {item.lastOpenedAt.slice(0, 10)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* 3. SEARCH & LATEST PATIENT FILES WITH FILTERING */}
        <motion.section
          {...fadeUp}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Patient Database Query &amp; Browse
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Find Patient &amp; Latest Patient Files ({filteredFiles.length}
                  )
                </h2>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground mr-1">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Level:
              </span>
              {(["ALL", "High", "Moderate", "Low"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    levelFilter === lvl
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-card"
                  )}
                >
                  {lvl === "ALL" ? "All Levels" : lvl}
                </button>
              ))}

              <select
                aria-label="Filter by gender"
                value={genderFilter}
                onChange={(e) =>
                  setGenderFilter(
                    e.target.value as "ALL" | "Female" | "Male"
                  )
                }
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground"
              >
                <option value="ALL">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          {/* Search Input by Name, National ID, or Patient ID */}
          <div className="relative mb-6">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient by full name, 14-digit National ID (e.g. 28405120101234), or Patient ID (e.g. PT-2026-001)..."
              className="w-full rounded-xl border border-border bg-background pl-12 pr-10 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/75 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Patient Files Table */}
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Patient ID</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">National ID (Fake)</th>
                  <th className="py-3.5 px-4">Demographics</th>
                  <th className="py-3.5 px-4">Recorded Diagnosis</th>
                  <th className="py-3.5 px-4 text-right">Likelihood</th>
                  <th className="py-3.5 px-4 text-center">Level</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 px-4 text-center text-muted-foreground"
                    >
                      No patient files match your current search or filter
                      criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-card/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-[13px] font-semibold text-primary whitespace-nowrap">
                        {file.patientCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <Link
                          href={`/patients/${file.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {file.displayName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[12px] text-muted-foreground whitespace-nowrap">
                        {file.nationalId}
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-muted-foreground whitespace-nowrap">
                        {file.gender} · {file.dobOrAge}
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-foreground max-w-[230px] truncate">
                        {file.recordedDiagnosis}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right font-serif text-lg font-semibold tabular-nums whitespace-nowrap"
                        style={{ color: levelColorHex(file.latestLevel) }}
                      >
                        {file.latestPct}%
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                            levelBadgeClasses(file.latestLevel)
                          )}
                        >
                          {file.latestLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/patients/${file.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                          <Link
                            href={`/patients/${file.id}?visit=new`}
                            title="Add clinical visit"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-background transition-colors"
                          >
                            <PlusCircle className="h-3.5 w-3.5 text-primary" />
                            <span>Visit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </RoleGuard>
  );
}
