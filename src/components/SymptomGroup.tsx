"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  id: string;
  label: string;
  group: string;
  points: number;
  pct_sarcoidosis: number | null;
  pct_other: number | null;
}

interface SymptomGroupProps {
  groupName: string;
  features: FeatureItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function SymptomGroup({
  groupName,
  features,
  selectedIds,
  onToggle,
}: SymptomGroupProps) {
  const selectedInGroup = features.filter((f) => selectedIds.includes(f.id)).length;

  return (
    <div className="rounded-xl border border-border bg-card/65 p-5 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/80">
        <h2 className="font-serif text-[22px] font-medium text-foreground leading-snug">
          {groupName}
        </h2>
        {selectedInGroup > 0 && (
          <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[12px] font-medium text-primary">
            {selectedInGroup} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {features.map((feature) => {
          const checked = selectedIds.includes(feature.id);
          const pts = feature.points;
          return (
            <label
              key={feature.id}
              htmlFor={`symptom-${feature.id}`}
              className={cn(
                "group relative flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3.5 transition-colors select-none",
                checked
                  ? "border-primary bg-primary/[0.08] text-foreground"
                  : "border-border bg-background/80 hover:border-primary/40 hover:bg-background"
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  id={`symptom-${feature.id}`}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(feature.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 bg-background group-hover:border-primary"
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                </span>
                <span className="text-[15px] font-medium leading-snug text-foreground">
                  {feature.label}
                </span>
              </div>

              <span
                title={
                  pts > 0
                    ? `Adds +${pts} points toward sarcoidosis likelihood`
                    : pts < 0
                    ? `${pts} points (more typical of a look-alike condition)`
                    : "Neutral weight (0 points) in current prototype"
                }
                className={cn(
                  "shrink-0 rounded px-2 py-0.5 text-[12px] font-semibold tabular-nums",
                  pts > 0
                    ? "bg-[#2E6DA4]/12 text-[#2E6DA4]"
                    : pts < 0
                    ? "bg-[#C0504D]/12 text-[#C0504D]"
                    : "bg-border/70 text-muted-foreground"
                )}
              >
                {pts > 0 ? `+${pts}` : pts}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
