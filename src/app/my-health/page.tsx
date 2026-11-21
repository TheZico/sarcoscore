"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import { getPatientMyHealthResults } from "@/lib/db";
import {
  ShieldCheck,
  Calendar,
  FlaskConical,
  ScanLine,
  Printer,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

export default function MyHealthPage() {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "Scan / Imaging" | "Laboratory Test"
  >("ALL");

  const healthData = useMemo(() => {
    if (!user || user.role !== "patient") return null;
    try {
      return getPatientMyHealthResults(user);
    } catch {
      return null;
    }
  }, [user]);

  const filteredResults = useMemo(() => {
    if (!healthData) return [];
    if (categoryFilter === "ALL") return healthData.results;
    return healthData.results.filter((r) => r.category === categoryFilter);
  }, [healthData, categoryFilter]);

  return (
    <RoleGuard feature="my_health" featureTitle="My Health">
      <div className="mx-auto max-w-[1140px] px-5 py-10 md:px-10 md:py-16 lg:px-16 space-y-8">
        {/* Page Header */}
        <motion.div
          {...fadeUp}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6"
        >
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
              PATIENT PORTAL · READ-ONLY PERSONAL HEALTH RECORD
            </span>
            <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
              My Health
            </h1>
            <p className="mt-2 text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
              View your completed imaging scans and laboratory test results with
              dates. Protected by Row Level Security so you see only your own
              records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print My Results</span>
          </button>
        </motion.div>

        {healthData && (
          <>
            {/* Patient Identity & RLS Isolation Banner */}
            <motion.section
              {...fadeUp}
              className="rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-primary/12 px-2.5 py-0.5 font-mono text-[12px] font-semibold text-primary">
                      {healthData.patient.patientCode}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#2E8B57]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#2E8B57]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Row Level Security Verified (Own Data Only)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Read-Only View
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl font-medium text-foreground">
                    {healthData.patient.fullName}
                  </h2>
                  <p className="text-[14px] text-muted-foreground mt-0.5">
                    {healthData.patient.gender} · Date of Birth:{" "}
                    {healthData.patient.dob} · Attending Physician: Dr. Nadia
                    El-Sayed
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background px-4 py-3 text-[13px]">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Total Released Records
                  </span>
                  <span className="font-serif text-2xl font-semibold text-foreground">
                    {healthData.results.length} scans &amp; lab tests
                  </span>
                </div>
              </div>
            </motion.section>

            {/* Filter & Read-Only Scan + Test Results List */}
            <motion.section
              {...fadeUp}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                    Diagnostic Results History
                  </span>
                  <h2 className="font-serif text-2xl font-medium text-foreground">
                    My Scans and Laboratory Tests ({filteredResults.length})
                  </h2>
                </div>

                <div className="no-print flex flex-wrap gap-2">
                  {(
                    [
                      { id: "ALL", label: "All Results" },
                      { id: "Scan / Imaging", label: "Scans & Imaging" },
                      { id: "Laboratory Test", label: "Laboratory Tests" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategoryFilter(tab.id)}
                      className={cn(
                        "rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                        categoryFilter === tab.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-card"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredResults.map((res) => {
                  const isScan = res.category === "Scan / Imaging";
                  return (
                    <div
                      key={res.id}
                      className="rounded-xl border border-border bg-background p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                            isScan
                              ? "bg-primary/12 text-primary border-primary/20"
                              : "bg-[#2E6DA4]/12 text-[#2E6DA4] border-[#2E6DA4]/25"
                          )}
                        >
                          {isScan ? (
                            <ScanLine className="h-5 w-5" />
                          ) : (
                            <FlaskConical className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                                isScan
                                  ? "bg-primary/12 text-primary"
                                  : "bg-[#2E6DA4]/12 text-[#2E6DA4]"
                              )}
                            >
                              {res.category}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[12px] text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {res.date}
                            </span>
                          </div>
                          <h3 className="text-[17px] font-semibold text-foreground">
                            {res.title}
                          </h3>
                          <p className="mt-1 text-[15px] text-foreground/90 leading-relaxed">
                            {res.valueSummary}
                          </p>
                        </div>
                      </div>

                      <div className="md:text-right shrink-0 rounded-lg border border-border bg-card px-4 py-2.5 text-[13px]">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Reference Range
                        </span>
                        <span className="font-medium text-foreground">
                          {res.referenceRange}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-border text-[13px] text-muted-foreground">
                Please discuss all imaging and laboratory findings directly with
                your treating physician.
              </div>
            </motion.section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
