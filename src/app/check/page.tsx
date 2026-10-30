"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import model from "@/data/model.json";
import { score } from "@/lib/scoring";
import { SymptomGroup } from "@/components/SymptomGroup";
import { LabInput } from "@/components/LabInput";
import { ResultCard } from "@/components/ResultCard";
import { RotateCcw, Sparkles, ChevronUp, X } from "lucide-react";
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

const DEMO_PRESETS = [
  { name: "Typical + ACE 110 (88%)", vectorIndex: 3 },
  { name: "Clinical Findings Only (72%)", vectorIndex: 1 },
  { name: "Mild Labs + Fever (18%)", vectorIndex: 4 },
  { name: "Look-Alike Symptoms (4%)", vectorIndex: 2 },
];

export default function CheckPatientPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [labStrings, setLabStrings] = useState<Record<string, string>>({});
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Group features by group in the required order
  const groupedFeatures = useMemo(() => {
    const groupsMap = new Map<string, typeof model.features>();
    for (const f of model.features) {
      const existing = groupsMap.get(f.group) ?? [];
      existing.push(f);
      groupsMap.set(f.group, existing);
    }

    const orderedGroups: { groupName: string; features: typeof model.features }[] = [];
    const seen = new Set<string>();

    for (const name of PREFERRED_GROUP_ORDER) {
      if (groupsMap.has(name)) {
        orderedGroups.push({ groupName: name, features: groupsMap.get(name)! });
        seen.add(name);
      }
    }

    for (const [name, feats] of groupsMap.entries()) {
      if (!seen.has(name)) {
        orderedGroups.push({ groupName: name, features: feats });
      }
    }

    return orderedGroups;
  }, []);

  // Convert string lab inputs to numeric record for score()
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

  const evaluation = useMemo(
    () =>
      score({
        symptoms: selectedSymptoms,
        labs: numericLabs,
      }),
    [selectedSymptoms, numericLabs]
  );

  const zeroPointSelectedLabels = useMemo(() => {
    return selectedSymptoms
      .map((id) => model.features.find((f) => f.id === id))
      .filter((f): f is NonNullable<typeof f> => Boolean(f && f.points === 0))
      .map((f) => f.label);
  }, [selectedSymptoms]);

  const handleToggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLabChange = (id: string, value: string) => {
    setLabStrings((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleClearAll = () => {
    setSelectedSymptoms([]);
    setLabStrings({});
  };

  const handleLoadPreset = (vectorIndex: number) => {
    const vec = model.test_vectors[vectorIndex];
    if (!vec) return;
    setSelectedSymptoms([...vec.input.symptoms]);
    const nextLabs: Record<string, string> = {};
    for (const [k, v] of Object.entries(vec.input.labs)) {
      if (v !== undefined && v !== null) {
        nextLabs[k] = String(v);
      }
    }
    setLabStrings(nextLabs);
  };

  const pct = Math.round(evaluation.probability * 100);
  const levelColorHex =
    evaluation.level === "High"
      ? "#C0504D"
      : evaluation.level === "Moderate"
      ? "#E3A21A"
      : "#2E8B57";

  return (
    <div className="mx-auto max-w-[1140px] px-5 pt-10 pb-28 lg:pb-16 md:px-10 md:pt-14 lg:px-16">
      {/* Print-only clinical header */}
      <div className="hidden print:block mb-6 pb-4 border-b border-gray-300">
        <h1 className="font-serif text-2xl font-bold">
          SarcoScore — Clinical Sarcoidosis Likelihood Summary
        </h1>
        <p className="text-sm text-gray-600 mt-1">{model.disclaimer}</p>
      </div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
        className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border pb-6"
      >
        <div className="max-w-2xl">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
            SARCOSCORE · LIVE CHECKER
          </span>
          <h1 className="font-serif text-3xl md:text-[40px] font-medium text-foreground leading-[1.15]">
            Check a patient
          </h1>
          <p className="mt-2.5 text-[16px] text-muted-foreground leading-relaxed">
            Tick the patient&apos;s symptoms and findings and enter any lab
            results. The likelihood score updates live with every change.
          </p>
        </div>

        {/* Sample Cases & Clear All */}
        <div className="no-print flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground mr-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Presets:
          </span>
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleLoadPreset(preset.vectorIndex)}
              className="rounded-lg border border-border bg-card/80 px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-primary/50 hover:bg-card transition-colors"
            >
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            Clear all
          </button>
        </div>
      </motion.div>

      {/* Two Columns on Desktop (Inputs Left, Sticky Result Card Right), One Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Symptom Group Cards + Labs Card at the end */}
        <div className="lg:col-span-7 space-y-5 no-print">
          {groupedFeatures.map(({ groupName, features }) => (
            <SymptomGroup
              key={groupName}
              groupName={groupName}
              features={features}
              selectedIds={selectedSymptoms}
              onToggle={handleToggleSymptom}
            />
          ))}

          {/* Labs Card at the end */}
          <div className="rounded-xl border border-border bg-card/65 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border/80">
              <h2 className="font-serif text-[22px] font-medium text-foreground leading-snug">
                Labs (optional)
              </h2>
              <span className="text-[13px] text-muted-foreground">
                Empty input means the test wasn&apos;t done
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {model.labs.map((lab) => (
                <LabInput
                  key={lab.id}
                  lab={lab}
                  rawValue={labStrings[lab.id] ?? ""}
                  onChange={handleLabChange}
                />
              ))}
            </div>
          </div>

          {/* Clear All Button */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-5 py-4">
            <span className="text-[13px] text-muted-foreground">
              No data leaves the browser, and nothing is saved.
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-[14px] font-medium text-foreground hover:bg-card transition-colors"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Result Card on Desktop, below inputs on Mobile */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <ResultCard
            total={evaluation.total}
            probability={evaluation.probability}
            level={evaluation.level}
            items={evaluation.items}
            zeroPointSelectedLabels={zeroPointSelectedLabels}
            onClearAll={handleClearAll}
          />
        </div>
      </div>

      {/* Mobile Slim Sticky Bottom Bar (expands to full ResultCard when tapped) */}
      <div className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40">
        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          className="flex w-full items-center justify-between border-t border-border bg-background/95 backdrop-blur-md px-5 py-3.5 shadow-mockup focus:outline-none"
          aria-label="Expand full likelihood result card"
        >
          <div className="flex items-center gap-3.5">
            <span
              className="font-serif text-3xl font-semibold tabular-nums leading-none"
              style={{ color: levelColorHex }}
            >
              {pct}%
            </span>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    evaluation.level === "High"
                      ? "bg-[#C0504D]/15 text-[#C0504D]"
                      : evaluation.level === "Moderate"
                      ? "bg-[#E3A21A]/20 text-[#9A6B08]"
                      : "bg-[#2E8B57]/15 text-[#2E8B57]"
                  )}
                >
                  {evaluation.level}
                </span>
                <span className="text-[13px] font-medium text-foreground tabular-nums">
                  total points:{" "}
                  {evaluation.total > 0
                    ? `+${evaluation.total}`
                    : evaluation.total}
                </span>
              </div>
              <span className="block text-[11px] text-muted-foreground">
                Tap to expand full breakdown
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-lg bg-card px-3 py-1.5 text-[12px] font-medium text-foreground border border-border">
            <span>Details</span>
            <ChevronUp className="h-4 w-4 text-primary" />
          </span>
        </button>
      </div>

      {/* Mobile Expanded Full Result Card Sheet */}
      <AnimatePresence>
        {mobileSheetOpen && (
          <div className="no-print lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileSheetOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative z-10 max-h-[88vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Full Result Breakdown
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[13px] font-medium text-foreground"
                >
                  <span>Close</span>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ResultCard
                total={evaluation.total}
                probability={evaluation.probability}
                level={evaluation.level}
                items={evaluation.items}
                zeroPointSelectedLabels={zeroPointSelectedLabels}
                onClearAll={() => {
                  handleClearAll();
                  setMobileSheetOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
