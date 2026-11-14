"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";

/**
 * Sanitized root error boundary.
 * Never displays raw stack traces, SQL errors, or internal database details to users.
 */
export default function GlobalErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-[680px] px-5 py-20 text-center">
      <div className="rounded-2xl border border-border bg-card p-8 md:p-10 shadow-mockup">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C0504D]/12 text-[#C0504D]">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
          CLINICAL PLATFORM · SAFE ERROR BOUNDARY
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-3">
          Something went wrong while loading this view
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">
          An unexpected application error occurred. For security and data
          protection, technical stack traces and internal database details are
          hidden.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-[14px] font-medium text-foreground hover:bg-card transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

