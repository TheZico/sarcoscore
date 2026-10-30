"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import model from "@/data/model.json";
import {
  ClipboardList,
  FlaskConical,
  Percent,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-[1140px] px-5 py-12 md:px-10 md:py-20 lg:px-16">
      {/* Page Header */}
      <motion.div {...fadeUp} className="mb-12 border-b border-border pb-8">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
          Transparent Clinical Methodology · Plain-Language Guide
        </span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
              How It Works
            </h1>
            <p className="mt-3 text-[17px] text-muted-foreground leading-relaxed">
              SarcoScore combines clinical symptoms, imaging findings, and
              laboratory results into a transparent likelihood percentage—showing
              doctors the exact point contribution of every factor.
            </p>
          </div>
          <Link
            href="/check"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <span>Try the Patient Checker</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* 3 Core Steps from Brief 3.4 */}
      <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.75, delay: 0.0, ease: [0.22, 1, 0.36, 1] as const }}
          className="rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1.5">
              Step 01
            </span>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
              Points for findings
            </h2>
            <p className="text-[16px] leading-relaxed text-foreground/85">
              Each symptom or finding has points from −2 to +5. They start from
              clinical knowledge of how typical the finding is for sarcoidosis,
              and are adjusted by how often it appeared in sarcoidosis cases
              compared with look-alike diseases. Findings that are more typical
              of TB or lymphoma, such as night sweats, get negative points.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[13px] text-muted-foreground">
            <span>Range per finding</span>
            <span className="font-semibold text-foreground">−2 to +5 pts</span>
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.75, delay: 0.07, ease: [0.22, 1, 0.36, 1] as const }}
          className="rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1.5">
              Step 02
            </span>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
              Points for labs
            </h2>
            <p className="text-[16px] leading-relaxed text-foreground/85">
              A lab gets points when it&apos;s outside its normal range. The
              further outside, the more points: up to 1.5× the limit gives ⅓ of
              its max points, 1.5–2× gives ⅔, and more than 2× gives full
              points.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[13px] text-muted-foreground">
            <span>Severity scaling</span>
            <span className="font-semibold text-foreground">⅓ · ⅔ · Full</span>
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.75, delay: 0.14, ease: [0.22, 1, 0.36, 1] as const }}
          className="rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
              <Percent className="h-5 w-5" />
            </div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1.5">
              Step 03
            </span>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
              From points to %
            </h2>
            <p className="text-[16px] leading-relaxed text-foreground/85">
              The patient starts at a{" "}
              {Math.round(model.pretest_probability * 100)}% base chance. Every
              2 points doubles the odds.
            </p>
            <div className="mt-4 space-y-2 rounded-xl bg-background/80 p-3.5 border border-border text-[13px]">
              {model.levels.map((lvl) => (
                <div
                  key={lvl.name}
                  className="flex items-center justify-between"
                >
                  <span className="font-semibold text-foreground">
                    {lvl.name} Likelihood
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round(lvl.min * 100)}% –{" "}
                    {Math.min(100, Math.round(lvl.max * 100))}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[13px] text-muted-foreground">
            <span>Maximum cap</span>
            <span className="font-semibold text-foreground">
              {Math.round(model.probability_cap * 100)}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Table of All Labs (Normal Range, Unit, Max Points) */}
      <motion.section
        {...fadeUp}
        className="mb-14 rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <div className="mb-6">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
            Laboratory Reference Table
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">
            All Laboratory Tests, Normal Ranges &amp; Max Points
          </h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Values within normal range add 0 points. Values beyond the abnormal
            threshold earn tiered points up to the maximum shown below.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-border bg-card/70 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-5">Laboratory Test</th>
                <th className="py-3.5 px-5">Normal Range</th>
                <th className="py-3.5 px-5">Unit</th>
                <th className="py-3.5 px-5">Scored Direction</th>
                <th className="py-3.5 px-5 text-right">Max Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {model.labs.map((lab) => (
                <tr
                  key={lab.id}
                  className="hover:bg-card/40 transition-colors"
                >
                  <td className="py-3.5 px-5 font-semibold text-foreground">
                    {lab.label}
                  </td>
                  <td className="py-3.5 px-5 tabular-nums text-foreground">
                    {lab.low} – {lab.high}
                  </td>
                  <td className="py-3.5 px-5 text-muted-foreground">
                    {lab.unit}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center rounded-md bg-card px-2.5 py-0.5 text-[12px] font-medium text-foreground border border-border">
                      {lab.direction === "high"
                        ? `Elevated (> ${lab.high} ${lab.unit})`
                        : `Reduced (< ${lab.low} ${lab.unit})`}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="inline-block rounded-md bg-[#2E6DA4]/12 px-2.5 py-0.5 text-[13px] font-semibold text-[#2E6DA4] tabular-nums">
                      +{lab.max_points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Limitations Callout (Section 3.4 #5) */}
      <motion.section
        id="limitations"
        {...fadeUp}
        className="rounded-2xl border border-[#E3A21A]/45 bg-[#E3A21A]/[0.08] p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E3A21A]/20 text-[#9A6B08]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A6B08] mb-1">
              Important Scope &amp; Limitations
            </span>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
              Limitations of the Current Prototype
            </h2>
            <p className="text-[16px] leading-relaxed text-foreground/90 mb-4">
              It&apos;s a research prototype built on {model.stats.total_cases}{" "}
              published cases ({model.stats.sarcoidosis_cases} sarcoidosis and{" "}
              {model.stats.other_cases} look-alike presentations). It is{" "}
              <strong>not a diagnosis</strong>, and{" "}
              <strong>biopsy is still required</strong> to confirm sarcoidosis
              after ruling out infectious and malignant look-alikes.
            </p>
            <div className="flex flex-wrap gap-4 text-[13px] font-medium text-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {model.disclaimer}
              </span>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

