"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import model from "@/data/model.json";
import {
  BookOpen,
  Table2,
  ClipboardList,
  FlaskConical,
  Percent,
  Aperture,
  Image as ImageIcon,
  FolderSearch,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

export default function MethodPage() {
  const baseChancePct = Math.round(model.pretest_probability * 100);

  return (
    <div className="mx-auto max-w-[1140px] px-5 py-12 md:px-10 md:py-20 lg:px-16">
      {/* Page Header */}
      <motion.div {...fadeUp} className="mb-12 border-b border-border pb-8">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
          Points-Based Scoring Model · Plain-Language Guide
        </span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
              How It Works
            </h1>
            <p className="mt-3 text-[17px] text-muted-foreground leading-relaxed">
              SarcoScore uses a transparent{" "}
              <strong className="font-semibold text-foreground">
                points-based scoring model
              </strong>{" "}
              built from published clinical case reports to combine symptoms,
              findings, and laboratory results into a clear likelihood
              percentage.
            </p>
          </div>
          <Link
            href="/check"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <span>Check a patient</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <div className="space-y-8">
        {/* 1. Where the data comes from & 2. How the data is organized */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Where the data comes from */}
          <motion.section
            {...fadeUp}
            className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    01 · Data Collection
                  </span>
                  <h2 className="font-serif text-2xl font-medium text-foreground">
                    Where the data comes from
                  </h2>
                </div>
              </div>

              <p className="text-[16px] leading-relaxed text-foreground/90">
                We collected published sarcoidosis case reports from public
                scientific sources (PubMed and Google Scholar), using searches
                such as &ldquo;sarcoidosis case report&rdquo;,
                &ldquo;sarcoidosis patient history&rdquo; and &ldquo;sarcoidosis
                review&rdquo;. For each case we recorded: age, symptoms, initial
                examination, test results, time to diagnosis, and the final
                confirmed disease. Some cases were confirmed sarcoidosis and
                others were look-alike diseases, so the model could be tested on
                both.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3.5 text-[15px] font-medium text-foreground">
              Sample: <strong>{model.stats.total_cases}</strong> cases (
              <strong>{model.stats.sarcoidosis_cases}</strong> sarcoidosis,{" "}
              <strong>{model.stats.other_cases}</strong> look-alikes).
            </div>
          </motion.section>

          {/* 2. How the data is organized */}
          <motion.section
            {...fadeUp}
            className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                  <Table2 className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    02 · Structure
                  </span>
                  <h2 className="font-serif text-2xl font-medium text-foreground">
                    How the data is organized
                  </h2>
                </div>
              </div>

              <p className="text-[16px] leading-relaxed text-foreground/90 mb-5">
                Symptoms and findings are recorded as yes/no. Lab tests are
                recorded as numbers. Age and time to diagnosis are numbers.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-[14px]">
                <span className="text-foreground font-medium">
                  Symptoms &amp; findings
                </span>
                <span className="rounded-md bg-primary/12 px-2.5 py-0.5 text-[12px] font-semibold text-primary">
                  Yes / No
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-[14px]">
                <span className="text-foreground font-medium">Lab tests</span>
                <span className="rounded-md bg-[#2E6DA4]/12 px-2.5 py-0.5 text-[12px] font-semibold text-[#2E6DA4]">
                  Numbers
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-[14px]">
                <span className="text-foreground font-medium">
                  Age &amp; time to diagnosis
                </span>
                <span className="rounded-md bg-[#2E6DA4]/12 px-2.5 py-0.5 text-[12px] font-semibold text-[#2E6DA4]">
                  Numbers
                </span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* 3. Points for findings, 4. Points for labs, 5. From points to % */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3. Points for findings */}
          <motion.section
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                03 · Finding Weights
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
                Points for findings
              </h2>
              <p className="text-[16px] leading-relaxed text-foreground/90">
                Each symptom or finding has points from −2 to +5. They start
                from clinical knowledge of how typical the finding is for
                sarcoidosis, and are adjusted by how often it appeared in
                sarcoidosis cases compared with look-alike diseases. Findings
                that are more typical of TB or lymphoma, such as night sweats,
                get negative points.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[13px] text-muted-foreground">
              <span>Point scale</span>
              <span className="font-semibold text-foreground">−2 to +5 pts</span>
            </div>
          </motion.section>

          {/* 4. Points for labs */}
          <motion.section
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                <FlaskConical className="h-5 w-5" />
              </div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                04 · Lab Tiers
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
                Points for labs
              </h2>
              <p className="text-[16px] leading-relaxed text-foreground/90">
                A lab gets points when it&apos;s outside its normal range. The
                further outside, the more points: up to 1.5× the limit gives ⅓
                of its max points, 1.5–2× gives ⅔, and more than 2× gives full
                points.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[13px] text-muted-foreground">
              <span>Tiers above/below limit</span>
              <span className="font-semibold text-foreground">
                ⅓ · ⅔ · Full
              </span>
            </div>
          </motion.section>

          {/* 5. From points to % */}
          <motion.section
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                <Percent className="h-5 w-5" />
              </div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
                05 · Probability Conversion
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
                From points to %
              </h2>
              <p className="text-[16px] leading-relaxed text-foreground/90">
                The patient starts at a {baseChancePct}% base chance. Every 2
                points doubles the odds.
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
          </motion.section>
        </div>

        {/* 6. Lab table */}
        <motion.section
          {...fadeUp}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <div className="mb-6">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
              06 · Laboratory Reference Table
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">
              Lab table
            </h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              All labs: normal range, unit, max points.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-left border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-border bg-card/70 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-5">Lab</th>
                  <th className="py-3.5 px-5">Normal range</th>
                  <th className="py-3.5 px-5">Unit</th>
                  <th className="py-3.5 px-5">Scored direction</th>
                  <th className="py-3.5 px-5 text-right">Max points</th>
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
                          ? `High (> ${lab.high} ${lab.unit})`
                          : `Low (< ${lab.low} ${lab.unit})`}
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

        {/* 7. How the project fits together (the team's camera analogy, as a simple 3-part graphic) */}
        <motion.section
          {...fadeUp}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <div className="mb-6">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
              07 · Camera Analogy
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">
              How the project fits together
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-stretch">
            {/* Part 1: Research is the scene */}
            <div className="md:col-span-3 rounded-xl border border-border bg-background p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    1 · The Scene
                  </span>
                  <FolderSearch className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                  Research
                </h3>
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  <strong>Research</strong> is the scene: the collected cases.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/70 text-[12px] text-muted-foreground">
                {model.stats.total_cases} published cases ({model.stats.sarcoidosis_cases} sarcoidosis, {model.stats.other_cases} look-alikes)
              </div>
            </div>

            {/* Arrow 1 -> 2 */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center text-primary">
              <ArrowRight className="h-6 w-6" />
            </div>

            {/* Part 2: The scoring model is the lens */}
            <div className="md:col-span-3 rounded-xl border border-primary/35 bg-primary/[0.06] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    2 · The Lens
                  </span>
                  <Aperture className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                  The scoring model
                </h3>
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  <strong>The scoring model</strong> is the lens: it processes
                  the data.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-primary/20 text-[12px] text-muted-foreground">
                Points-based scoring model ({model.features.length} findings +{" "}
                {model.labs.length} labs)
              </div>
            </div>

            {/* Arrow 2 -> 3 */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center text-primary">
              <ArrowRight className="h-6 w-6" />
            </div>

            {/* Part 3: The platform is the photograph */}
            <div className="md:col-span-3 rounded-xl border border-border bg-background p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    3 · The Photograph
                  </span>
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                  The platform
                </h3>
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  <strong>The platform</strong> is the photograph: it shows the
                  result in a clear, usable way.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/70 text-[12px] text-muted-foreground">
                Likelihood % with transparent item-by-item breakdown
              </div>
            </div>
          </div>
        </motion.section>

        {/* 8. Planned platform (not part of this demo) */}
        <motion.section
          id="planned-platform"
          {...fadeUp}
          className="rounded-2xl border border-border bg-card/75 p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  08 · Roadmap Scope
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Not part of this demo
                </span>
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                Planned platform
              </h2>
              <p className="text-[16px] leading-relaxed text-foreground/90">
                Planned next stage. This demo contains only the likelihood
                calculator. A future version is planned with doctor accounts,
                patient files, a research page for adding new cases, and an
                admin area. It is not built yet.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 9. Limitations */}
        <motion.section
          id="limitations"
          {...fadeUp}
          className="rounded-2xl border border-[#E3A21A]/45 bg-[#E3A21A]/[0.08] p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3A21A]/20 text-[#9A6B08]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A6B08] mb-1">
                09 · Prototype Scope
              </span>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                Limitations
              </h2>
              <p className="text-[16px] leading-relaxed text-foreground/90">
                It&apos;s a research prototype built on{" "}
                <strong>{model.stats.total_cases}</strong> published cases. It
                is not a diagnosis, and biopsy is still required. Percentages
                for rarely reported findings rest on very few cases. Validation
                with more cases is planned. When new cases are added, the team
                regenerates the model file and the site updates from it.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
