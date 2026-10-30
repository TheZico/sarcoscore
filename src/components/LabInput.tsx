"use client";

import React from "react";
import { labPoints } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export interface LabDefinition {
  id: string;
  label: string;
  unit: string;
  low: number;
  high: number;
  direction: string;
  max_points: number;
}

interface LabInputProps {
  lab: LabDefinition;
  rawValue: string;
  onChange: (id: string, value: string) => void;
}

export function LabInput({ lab, rawValue, onChange }: LabInputProps) {
  const numericVal =
    rawValue.trim() === "" ? undefined : Number.parseFloat(rawValue);
  const isValidNumber =
    numericVal !== undefined && !Number.isNaN(numericVal) && numericVal >= 0;

  const evalResult = isValidNumber ? labPoints(lab.id, numericVal) : null;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        evalResult && evalResult.points > 0
          ? "border-[#2E6DA4]/50 bg-[#2E6DA4]/[0.05]"
          : isValidNumber
          ? "border-primary/40 bg-background"
          : "border-border bg-background/80"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <label
            htmlFor={`lab-${lab.id}`}
            className="block text-[15px] font-semibold text-foreground"
          >
            {lab.label}
          </label>
          <span className="block text-[12px] text-muted-foreground">
            Normal: {lab.low}–{lab.high} {lab.unit}
          </span>
        </div>
        <span className="shrink-0 rounded bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
          Max +{lab.max_points} pt{lab.max_points > 1 ? "s" : ""} (
          {lab.direction === "high" ? "High" : "Low"})
        </span>
      </div>

      <div className="relative mt-2 flex items-center">
        <input
          id={`lab-${lab.id}`}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          placeholder="Not done"
          value={rawValue}
          onChange={(e) => onChange(lab.id, e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 pr-20 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="pointer-events-none absolute right-3 text-[12px] font-medium text-muted-foreground">
          {lab.unit}
        </span>
      </div>

      {evalResult && (
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span
            className={cn(
              "font-medium",
              evalResult.points > 0 ? "text-[#2E6DA4]" : "text-muted-foreground"
            )}
          >
            {evalResult.status === "Normal"
              ? "Within normal range"
              : `${evalResult.status} (${evalResult.ratio}× limit)`}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              evalResult.points > 0 ? "text-[#2E6DA4]" : "text-muted-foreground"
            )}
          >
            +{evalResult.points} pt{evalResult.points === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </div>
  );
}

