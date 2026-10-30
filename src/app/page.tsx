"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import model from "@/data/model.json";
import { score } from "@/lib/scoring";
import {
  ArrowRight,
  Clock,
  AlertCircle,
  Layers,
  Users,
  ClipboardCheck,
  Calculator,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE_CALM: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUpSection = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.75, ease: EASE_CALM },
};

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    icon: ClipboardCheck,
    title: "Enter symptoms & labs",
    description:
      "Tick the patient's presenting clinical findings across body systems and enter any available laboratory results.",
  },
  {
    step: "02",
    icon: Calculator,
    title: "Points are added",
    description:
      "Typical sarcoidosis findings and abnormal labs add positive points, while findings more typical of look-alikes subtract points.",
  },
  {
    step: "03",
    icon: Percent,
    title: "Likelihood %",
    description:
      "Starting from a 10% base probability, every 2 points doubles the odds to return a transparent likelihood percentage and breakdown.",
  },
];

export default function HomePage() {
  // Build the read-only example result card directly from model.test_vectors[1]
  const exampleVector = model.test_vectors[1];
  const exampleResult = score({
    symptoms: exampleVector.input.symptoms,
    labs: exampleVector.input.labs as Record<string, number | undefined>,
  });
  const examplePct = Math.round(exampleResult.probability * 100);
  const exampleColorHex =
    exampleResult.level === "High"
      ? "#C0504D"
      : exampleResult.level === "Moderate"
      ? "#E3A21A"
      : "#2E8B57";

  const medianMonths = model.stats.diagnostic_time_months.median;
  const maxYears = model.stats.diagnostic_time_months.max / 12;
  const lookalikeCount = model.stats.lookalike_diseases.length;

  return (
    <div className="overflow-x-hidden">
      {/* 1. SPLIT HERO */}
      <section className="mx-auto max-w-[1140px] px-5 pt-12 pb-16 md:px-10 md:py-24 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Eyebrow, H1, One-line Subline, "Check a patient" Button */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_CALM }}
            className="md:col-span-7"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-4">
              SARCOSCORE · FOR MEDICAL DOCTORS
            </span>
            <h1
              className="font-serif font-medium text-foreground tracking-tight"
              style={{
                fontSize: "clamp(36px, 4.4vw, 60px)",
                lineHeight: 1.14,
              }}
            >
              Helping doctors suspect sarcoidosis earlier.
            </h1>
            <p className="mt-5 text-[18px] leading-[1.7] text-muted-foreground max-w-xl">
              Tick a patient&apos;s symptoms, imaging findings, and lab results
              to see an instant sarcoidosis likelihood % with a transparent
              points breakdown.
            </p>

            <div className="mt-8">
              <Link
                href="/check"
                className="inline-flex items-center gap-2.5 rounded-lg bg-primary px-6 py-3.5 text-[16px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <span>Check a patient</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right: Small Read-Only Example Result Card from model.test_vectors[1] */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_CALM, delay: 0.1 }}
            className="md:col-span-5"
          >
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-mockup">
              <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Example case
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    exampleResult.level === "High"
                      ? "bg-[#C0504D]/12 text-[#C0504D] border-[#C0504D]/30"
                      : exampleResult.level === "Moderate"
                      ? "bg-[#E3A21A]/15 text-[#9A6B08] border-[#E3A21A]/40"
                      : "bg-[#2E8B57]/12 text-[#2E8B57] border-[#2E8B57]/30"
                  )}
                >
                  {exampleResult.level}
                </span>
              </div>

              {/* Big % and Total Points */}
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="font-serif text-5xl font-semibold tracking-tight tabular-nums"
                  style={{ color: exampleColorHex }}
                >
                  {examplePct}%
                </span>
                <span className="text-[13px] font-medium text-muted-foreground">
                  {exampleResult.level}, total points:{" "}
                  <strong className="text-foreground tabular-nums">
                    +{exampleResult.total}
                  </strong>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-background border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${examplePct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: EASE_CALM }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: exampleColorHex }}
                />
              </div>

              {/* Contributing Findings from model.test_vectors[1] */}
              <div className="mt-4 pt-3.5 border-t border-border">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
                  Why
                </span>
                <ul className="space-y-1.5">
                  {exampleResult.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between rounded-md bg-background/85 px-3 py-1.5 text-[13px] border border-border/70"
                    >
                      <span className="text-foreground font-medium">
                        {item.label}
                      </span>
                      <span className="font-semibold tabular-nums text-[#2E6DA4]">
                        +{item.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-3.5 text-[11px] text-muted-foreground">
                Decision support for the doctor. Not a diagnosis.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. THE PROBLEM IN 3 STAT CARDS (One Row) */}
      <motion.section
        {...fadeUpSection}
        className="border-t border-border bg-card/45"
      >
        <div className="mx-auto max-w-[1140px] px-5 py-16 md:px-10 md:py-20 lg:px-16">
          <div className="mb-8">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
              THE CLINICAL PROBLEM
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] font-medium text-foreground leading-tight">
              Why sarcoidosis is often diagnosed late
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                stat: `${medianMonths} months`,
                label: "Median time to diagnosis",
                desc: `In our case dataset, the median delay from symptom onset to confirmed diagnosis is ${medianMonths} months.`,
              },
              {
                icon: AlertCircle,
                stat: `${maxYears} years`,
                label: "Longest diagnostic delay",
                desc: `The longest delay in the cohort reached ${model.stats.diagnostic_time_months.max} months (${maxYears} years).`,
              },
              {
                icon: Layers,
                stat: `${lookalikeCount} look-alikes`,
                label: "Look-alike diseases",
                desc: `Mimics ${model.stats.lookalike_diseases
                  .slice(0, 3)
                  .join(", ")}, TB, and Hodgkin's lymphoma.`,
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.75,
                  delay: i * 0.07,
                  ease: EASE_CALM,
                }}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="font-serif text-4xl font-medium text-foreground">
                  {card.stat}
                </p>
                <h3 className="mt-1.5 text-[18px] font-semibold text-foreground">
                  {card.label}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 3. HOW IT WORKS IN 3 STEPS */}
      <motion.section
        {...fadeUpSection}
        className="mx-auto max-w-[1140px] px-5 py-16 md:px-10 md:py-20 lg:px-16 border-t border-border"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
              HOW IT WORKS
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] font-medium text-foreground leading-tight">
              Three steps to a likelihood score
            </h2>
          </div>
          <Link
            href="/method"
            className="sage-link inline-flex items-center gap-1.5 text-[15px] font-medium text-primary"
          >
            <span>Read full methodology</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS_STEPS.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.75,
                delay: idx * 0.07,
                ease: EASE_CALM,
              }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-2xl font-semibold text-primary">
                  {item.step}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <h3 className="text-[19px] font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. TEAM SECTION (Placeholder Names from Brief 3.1) */}
      <motion.section
        id="team"
        {...fadeUpSection}
        className="border-t border-border bg-card/45"
      >
        <div className="mx-auto max-w-[1140px] px-5 py-16 md:px-10 md:py-20 lg:px-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
                RESEARCH TEAM
              </span>
              <h2 className="font-serif text-[28px] md:text-[34px] font-medium text-foreground leading-tight">
                Student Science Competition Team
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-[12px] font-medium text-foreground border border-border self-start sm:self-auto">
              <Users className="h-3.5 w-3.5 text-primary" />
              [School / Competition Placeholder]
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                name: "Hazem [Last Name Placeholder]",
                role: "Scoring Model & Clinical Dataset Engineering",
              },
              {
                name: "[Team Member 2 Placeholder]",
                role: "Case Literature Curation & Analysis",
              },
              {
                name: "[Team Member 3 Placeholder]",
                role: "Clinical Presentation & Research Poster",
              },
            ].map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-border bg-background p-5"
              >
                <p className="text-[16px] font-semibold text-foreground">
                  {member.name}
                </p>
                <p className="mt-1 text-[14px] text-muted-foreground">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
