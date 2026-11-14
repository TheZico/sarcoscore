"use client";

import React from "react";
import { Item } from "@/lib/scoring";
import model from "@/data/model.json";
import { Printer, RotateCcw, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  total: number;
  probability: number;
  level: string;
  items: Item[];
  zeroPointSelectedLabels?: string[];
  onClearAll: () => void;
}

export function ResultCard({
  total,
  probability,
  level,
  items,
  zeroPointSelectedLabels = [],
  onClearAll,
}: ResultCardProps) {
  const pct = Math.round(probability * 100);

  const levelColorHex =
    level === "High"
      ? "#C0504D"
      : level === "Moderate"
      ? "#E3A21A"
      : "#2E8B57";

  const levelBadgeClass =
    level === "High"
      ? "bg-[#C0504D]/12 text-[#C0504D] border-[#C0504D]/30"
      : level === "Moderate"
      ? "bg-[#E3A21A]/15 text-[#9A6B08] border-[#E3A21A]/40"
      : "bg-[#2E8B57]/12 text-[#2E8B57] border-[#2E8B57]/30";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-mockup print-break-inside-avoid">
      {/* Header Eyebrow */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-border">
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Live Clinical Evaluation
          </span>
          <h2 className="font-serif text-2xl font-medium text-foreground">
            Sarcoidosis Likelihood
          </h2>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold",
            levelBadgeClass
          )}
        >
          {level} Likelihood
        </span>
      </div>

      {/* Big Percentage Display */}
      <div className="my-6 flex flex-col items-start">
        <div className="flex items-baseline gap-3">
          <span
            className="font-serif text-6xl md:text-7xl font-semibold tracking-tight tabular-nums transition-colors duration-300"
            style={{ color: levelColorHex }}
          >
            {pct}%
          </span>
          <span className="text-[14px] font-medium text-muted-foreground">
            estimated likelihood
          </span>
        </div>

        <p className="mt-2 text-[15px] font-medium text-foreground">
          {level}, total points:{" "}
          <span className="font-semibold tabular-nums">
            {total > 0 ? `+${total}` : total}
          </span>
        </p>

        {/* Progress Bar */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-background border border-border">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.max(4, Math.min(100, pct))}%`,
              backgroundColor: levelColorHex,
            }}
          />
        </div>
        <div className="mt-1.5 flex w-full justify-between text-[11px] text-muted-foreground">
          <span>0% (Low &lt;30%)</span>
          <span>30%–60% (Moderate)</span>
          <span>High (&ge;60%)</span>
        </div>
      </div>

      {/* Next Step Callout when level is not Low */}
      {level !== "Low" && (
        <div
          className={cn(
            "mb-6 rounded-xl border p-4",
            level === "High"
              ? "border-[#C0504D]/35 bg-[#C0504D]/[0.07]"
              : "border-[#E3A21A]/40 bg-[#E3A21A]/[0.09]"
          )}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              style={{ color: levelColorHex }}
            />
            <div className="text-[14px] leading-relaxed text-foreground">
              <p className="font-semibold mb-0.5">Clinical Recommendation</p>
              <p>{model.next_step_text}</p>
            </div>
          </div>
        </div>
      )}

      {/* "Why" Points Breakdown */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold uppercase tracking-[0.08em] text-foreground">
            Why ({items.length} contributing{" "}
            {items.length === 1 ? "factor" : "factors"})
          </h3>
          <span className="text-[12px] text-muted-foreground">
            Base pretest: {Math.round(model.pretest_probability * 100)}%
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/60 p-4 text-[14px] text-muted-foreground flex items-start gap-2.5">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              No scored findings or abnormal labs selected yet. Starting at the{" "}
              {Math.round(model.pretest_probability * 100)}% baseline pretest
              probability (0 points).
            </span>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => {
              const isPositive = item.points > 0;
              return (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 text-[14px]"
                >
                  <span className="font-medium text-foreground leading-snug">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2.5 py-0.5 text-[13px] font-semibold tabular-nums",
                      isPositive
                        ? "bg-[#2E6DA4]/12 text-[#2E6DA4]"
                        : "bg-[#C0504D]/12 text-[#C0504D]"
                    )}
                  >
                    {isPositive ? `+${item.points}` : item.points}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {zeroPointSelectedLabels.length > 0 && (
          <div className="mt-3 rounded-lg bg-background/50 px-3 py-2 text-[12px] text-muted-foreground border border-border/60">
            <span className="font-medium text-foreground/80">
              Also noted (0 pts in model):{" "}
            </span>
            {zeroPointSelectedLabels.join(", ")}
          </div>
        )}
      </div>

      {/* Action Buttons: Print / Save as PDF & Clear All */}
      <div className="no-print mt-6 pt-5 border-t border-border flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save as PDF</span>
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-background/70 transition-colors"
        >
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          <span>Clear all</span>
        </button>
      </div>

      {/* Decision Support Note */}
      <div className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          Decision support only. Confirm with a specialist and biopsy.
        </span>
      </div>
    </div>
  );
}

