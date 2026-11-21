"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import model from "@/data/model.json";
import { score } from "@/lib/scoring";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME_ROUTE, ROLE_LABELS, canUseQuickCalculator } from "@/lib/rls";
import {
  ArrowRight,
  LogIn,
  Clock,
  AlertCircle,
  Layers,
  FolderSearch,
  Aperture,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE_CALM: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUpSection = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.75, ease: EASE_CALM },
};

export default function HomePage() {
  const { user } = useAuth();

  // Read-only example result card from model.test_vectors[1]
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
    <div>
      {/* 1. SPLIT HERO */}
      <section className="mx-auto max-w-[1140px] px-5 pt-12 pb-16 md:px-10 md:py-24 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Eyebrow, H1, Subline, Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_CALM }}
            className="md:col-span-7"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-4">
              SARCOSCORE · SARCOIDOSIS CLINICAL DECISION SUPPORT PLATFORM
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
            <p className="mt-5 text-[17px] leading-[1.7] text-muted-foreground max-w-xl">
              Evaluate patient symptoms, imaging findings, and laboratory test
              results to see a transparent sarcoidosis likelihood percentage
              with an item-by-item point breakdown.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {user ? (
                <>
                  <Link
                    href={ROLE_HOME_ROUTE[user.role]}
                    className="inline-flex items-center gap-2.5 rounded-lg bg-primary px-6 py-3.5 text-[16px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    <span>Go to {ROLE_LABELS[user.role]} Home</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {canUseQuickCalculator(user) && (
                    <Link
                      href="/check"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-background"
                    >
                      <span>Quick Calculator</span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 rounded-lg bg-primary px-6 py-3.5 text-[16px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login to Platform</span>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Right: Fixed Read-Only Example Result Card labeled "Example case" with no inputs (hidden only for Patient role) */}
          {user?.role !== "patient" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: EASE_CALM, delay: 0.1 }}
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
                    {exampleResult.level} Likelihood
                  </span>
                </div>

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

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-background border border-border">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${examplePct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.75, ease: EASE_CALM }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: exampleColorHex }}
                  />
                </div>

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
                  Decision support only. Confirm with a specialist and biopsy.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: EASE_CALM, delay: 0.1 }}
              className="md:col-span-5"
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-mockup">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
                  Patient Health Portal
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  My Health Records
                </h2>
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
                  Access your completed imaging scans and laboratory test
                  results with dates in a read-only personal health view.
                </p>
                <Link
                  href="/my-health"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  <span>Open My Health</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* 2. CAMERA ANALOGY GRAPHIC: Research = Scene, Model = Lens, Platform = Photograph */}
      <motion.section
        {...fadeUpSection}
        className="border-t border-border bg-card/45"
      >
        <div className="mx-auto max-w-[1140px] px-5 py-16 md:px-10 md:py-20 lg:px-16">
          <div className="mb-8">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
              HOW THE PROJECT FITS TOGETHER · THE CAMERA ANALOGY
            </span>
            <h2 className="font-serif text-[28px] md:text-[36px] font-medium text-foreground leading-tight">
              Research is the scene, the model is the lens, the platform is the
              photograph
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-stretch">
            {/* Part 1: Research is the scene */}
            <div className="md:col-span-3 rounded-2xl border border-border bg-background p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    1 · The Scene
                  </span>
                  <FolderSearch className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-foreground mb-2">
                  Research
                </h3>
                <p className="text-[16px] leading-relaxed text-foreground/90">
                  <strong>Research</strong> is the scene: the collected clinical
                  cases from published literature that provide the foundation.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-border/70 text-[13px] font-medium text-muted-foreground">
                {model.stats.total_cases} published cases ({model.stats.sarcoidosis_cases} sarcoidosis, {model.stats.other_cases} look-alikes)
              </div>
            </div>

            {/* Arrow 1 -> 2 */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center text-primary">
              <ArrowRight className="h-6 w-6" />
            </div>

            {/* Part 2: The model is the lens */}
            <div className="md:col-span-3 rounded-2xl border border-primary/35 bg-primary/[0.06] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    2 · The Lens
                  </span>
                  <Aperture className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-foreground mb-2">
                  The scoring model
                </h3>
                <p className="text-[16px] leading-relaxed text-foreground/90">
                  <strong>The model</strong> is the lens: it processes the
                  patient&apos;s symptoms, findings, and lab ranges to estimate
                  sarcoidosis likelihood.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-primary/20 text-[13px] font-medium text-muted-foreground">
                Points-based scoring ({model.features.length} findings +{" "}
                {model.labs.length} lab tests)
              </div>
            </div>

            {/* Arrow 2 -> 3 */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center text-primary">
              <ArrowRight className="h-6 w-6" />
            </div>

            {/* Part 3: The platform is the photograph */}
            <div className="md:col-span-3 rounded-2xl border border-border bg-background p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    3 · The Photograph
                  </span>
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-foreground mb-2">
                  The platform
                </h3>
                <p className="text-[16px] leading-relaxed text-foreground/90">
                  <strong>The platform</strong> is the photograph: it organizes
                  patient files and presents the likelihood result in a clear,
                  usable way.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-border/70 text-[13px] font-medium text-muted-foreground">
                4 roles · Dashboard, Cases, Research &amp; Admin
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. HOW DATA WAS COLLECTED FROM PUBMED & GOOGLE SCHOLAR (30 CASES) */}
      <motion.section
        {...fadeUpSection}
        className="mx-auto max-w-[1140px] px-5 py-16 md:px-10 md:py-20 lg:px-16 border-t border-border"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-3">
              <BookOpen className="h-3.5 w-3.5" />
              Published Case Report Dataset ({model.stats.total_cases} Cases)
            </div>
            <h2 className="font-serif text-[28px] md:text-[36px] font-medium text-foreground leading-tight mb-4">
              How the case data was collected from PubMed and Google Scholar
            </h2>
            <p className="text-[17px] leading-relaxed text-foreground/90 mb-4">
              We collected{" "}
              <strong>{model.stats.total_cases} published clinical case reports</strong>{" "}
              from public scientific databases (<strong>PubMed</strong> and{" "}
              <strong>Google Scholar</strong>) using search queries including{" "}
              <em>&ldquo;sarcoidosis case report&rdquo;</em>,{" "}
              <em>&ldquo;sarcoidosis patient history&rdquo;</em>, and{" "}
              <em>&ldquo;sarcoidosis review&rdquo;</em>.
            </p>
            <p className="text-[17px] leading-relaxed text-muted-foreground">
              For each case, we recorded patient age, presenting symptoms across
              body systems (binary yes/no), initial physical examination,
              laboratory and imaging test results, time to diagnosis, and the
              final confirmed disease—covering both{" "}
              <strong>
                {model.stats.sarcoidosis_cases} confirmed sarcoidosis cases
              </strong>{" "}
              and{" "}
              <strong>
                {model.stats.other_cases} look-alike presentations
              </strong>{" "}
              (such as tuberculosis and lymphoma) so the scoring model could be
              evaluated against both.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            {[
              {
                icon: Clock,
                stat: `${medianMonths} months`,
                label: "Median time to diagnosis",
                desc: `Across the ${model.stats.total_cases} published cases, median diagnostic delay was ${medianMonths} months.`,
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
                label: "Look-alike diseases compared",
                desc: `Includes ${model.stats.lookalike_diseases
                  .slice(0, 3)
                  .join(", ")}, TB, and Hodgkin's lymphoma.`,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-card p-4 flex items-start gap-3.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-semibold text-foreground">
                      {card.stat}
                    </span>
                    <span className="text-[14px] font-semibold text-foreground">
                      · {card.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-muted-foreground leading-snug">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
