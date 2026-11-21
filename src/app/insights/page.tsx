"use client";

import React from "react";
import { motion } from "framer-motion";
import model from "@/data/model.json";
import { useAuth } from "@/lib/auth";
import { canUseQuickCalculator } from "@/lib/rls";
import {
  MostFrequentChart,
  PointsPerFindingChart,
  AgeGroupsChart,
  DiagnosticTimeChart,
} from "@/components/charts/InsightsCharts";
import {
  Database,
  Users,
  Clock,
  Activity,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

function formatPct(val: number | null): string {
  if (val === null || val === undefined) return "–";
  return `${Math.round(val * 100)}%`;
}

export default function InsightsPage() {
  const { user } = useAuth();
  const { stats, features } = model;

  return (
    <div className="mx-auto max-w-[1140px] px-5 py-12 md:px-10 md:py-20 lg:px-16">
      {/* Header */}
      <motion.div {...fadeUp} className="mb-12 border-b border-border pb-8">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
          Clinical Dataset Analysis · Model Version {model.version}
        </span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
              What the Data Shows
            </h1>
            <p className="mt-3 text-[17px] text-muted-foreground leading-relaxed">
              Quantitative findings from our curated dataset of{" "}
              {stats.total_cases} published clinical cases comparing confirmed
              sarcoidosis presentations against look-alike diseases.
            </p>
          </div>
          {canUseQuickCalculator(user) ? (
            <Link
              href="/check"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <span>Check a Patient</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : !user ? (
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <span>Login to Platform</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </motion.div>

      {/* Summary Chips Grid */}
      <motion.div
        {...fadeUp}
        className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Database className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              Cohort Size
            </span>
          </div>
          <p className="font-serif text-3xl font-medium text-foreground">
            {stats.total_cases} cases
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {stats.sarcoidosis_cases} sarcoidosis and {stats.other_cases}{" "}
            look-alikes
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              Patient Age
            </span>
          </div>
          <p className="font-serif text-3xl font-medium text-foreground">
            {stats.avg_age} yrs
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Average age (range {stats.age_min}–{stats.age_max} yrs)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Activity className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              Sex Distribution
            </span>
          </div>
          <p className="font-serif text-3xl font-medium text-foreground">
            {stats.female} female / {stats.male} male
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Among {stats.sarcoidosis_cases} confirmed sarcoidosis cases
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              Diagnostic Delay
            </span>
          </div>
          <p className="font-serif text-3xl font-medium text-foreground">
            {stats.diagnostic_time_months.median} mo median
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Mean {stats.diagnostic_time_months.avg} mo · Max{" "}
            {stats.diagnostic_time_months.max / 12} yrs (
            {stats.diagnostic_time_months.max} mo)
          </p>
        </div>
      </motion.div>

      {/* Look-Alike Diseases Chips */}
      <motion.div
        {...fadeUp}
        className="mb-12 rounded-xl border border-border bg-card/70 p-6"
      >
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1.5">
          Differential Diagnosis Challenge
        </span>
        <h2 className="font-serif text-xl font-medium text-foreground mb-3">
          {stats.lookalike_diseases.length} Look-Alike Diseases in the Comparison
          Cohort
        </h2>
        <div className="flex flex-wrap gap-2">
          {stats.lookalike_diseases.map((disease) => (
            <span
              key={disease}
              className="inline-flex items-center rounded-lg border border-border bg-background px-3.5 py-1.5 text-[14px] font-medium text-foreground"
            >
              {disease}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Chart 1: Most frequent findings in sarcoidosis */}
      <motion.section
        {...fadeUp}
        className="mb-12 rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <div className="mb-6">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
            Chart 1 · Clinical Presentation
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">
            Most Frequent Findings in Sarcoidosis (Top 10)
          </h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Number of confirmed sarcoidosis patients presenting with each finding
            out of {stats.sarcoidosis_cases} cases.
          </p>
        </div>
        <MostFrequentChart />
      </motion.section>

      {/* Chart 2: Points per finding */}
      <motion.section
        {...fadeUp}
        className="mb-12 rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
              Chart 2 · Diagnostic Weighting
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">
              Points per Finding (All {features.length} Features)
            </h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Sorted by diagnostic point contribution (−2 to +3).{" "}
              <span className="font-semibold text-[#C0504D]">
                negative = more typical of a look-alike disease
              </span>
              .
            </p>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-primary" />
              Favors Sarcoidosis (+)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#C0504D]" />
              Favors Look-Alike (−)
            </span>
          </div>
        </div>
        <PointsPerFindingChart />
      </motion.section>

      {/* Charts 3 & 4 Side by Side: Age Groups & Time to Diagnosis */}
      <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section
          {...fadeUp}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
            Chart 3 · Demographics
          </span>
          <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
            Age Groups at Presentation
          </h2>
          <p className="text-[14px] text-muted-foreground mb-6">
            Distribution across age brackets (mean {stats.avg_age} years).
          </p>
          <AgeGroupsChart />
        </motion.section>

        <motion.section
          {...fadeUp}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
            Chart 4 · Diagnostic Delay
          </span>
          <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
            Time to Diagnosis per Patient (Months)
          </h2>
          <p className="text-[14px] text-muted-foreground mb-6">
            One bar per patient with a dashed median line at{" "}
            {stats.diagnostic_time_months.median} months (max{" "}
            {stats.diagnostic_time_months.max} months /{" "}
            {stats.diagnostic_time_months.max / 12} years).
          </p>
          <DiagnosticTimeChart />
        </motion.section>
      </div>

      {/* Complete Feature Comparison Table (showing pct_sarcoidosis and pct_other, with "–" for null) */}
      <motion.section
        {...fadeUp}
        className="mb-12 rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Complete Feature Breakdown
            </span>
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Prevalence in Sarcoidosis vs. Look-Alike Cases
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card/70 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Finding</th>
                <th className="py-3.5 px-4">Group</th>
                <th className="py-3.5 px-4 text-right">% in Sarcoidosis</th>
                <th className="py-3.5 px-4 text-right">% in Look-Alikes</th>
                <th className="py-3.5 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {features.map((f) => (
                <tr key={f.id} className="hover:bg-card/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">
                    {f.label}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{f.group}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-foreground">
                    {formatPct(f.pct_sarcoidosis)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                    {formatPct(f.pct_other)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={cn(
                        "inline-block rounded px-2 py-0.5 text-[12px] font-semibold tabular-nums",
                        f.points > 0
                          ? "bg-[#2E6DA4]/12 text-[#2E6DA4]"
                          : f.points < 0
                          ? "bg-[#C0504D]/12 text-[#C0504D]"
                          : "bg-border/60 text-muted-foreground"
                      )}
                    >
                      {f.points > 0 ? `+${f.points}` : f.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Required Footer Note on Insights Page */}
      <div className="rounded-xl border border-border bg-card/60 px-6 py-4 text-center text-[14px] font-medium text-muted-foreground">
        Pilot dataset of published case reports. Validation with more cases is
        planned.
      </div>
    </div>
  );
}

