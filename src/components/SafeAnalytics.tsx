"use client";

import React from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Wraps Vercel Web Analytics with a strict privacy beforeSend filter:
 * - Strips query parameters and hashes from all URLs
 * - Redacts dynamic /patients/<id> paths to /patients/[id]
 * so patient identifiers, names, or National IDs can never appear in analytics.
 */
export function SafeAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        try {
          const parsed = new URL(event.url);
          parsed.search = "";
          parsed.hash = "";
          parsed.pathname = parsed.pathname.replace(
            /^\/patients\/[^/]+$/,
            "/patients/[id]"
          );
          return {
            ...event,
            url: parsed.toString(),
          };
        } catch {
          return event;
        }
      }}
    />
  );
}
