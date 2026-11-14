"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { AppFeature, ROLE_HOME_ROUTE, ROLE_LABELS } from "@/lib/rls";
import { ShieldAlert, Lock, ArrowRight } from "lucide-react";

interface RoleGuardProps {
  feature: AppFeature;
  featureTitle: string;
  children: React.ReactNode;
}

export function RoleGuard({
  feature,
  featureTitle,
  children,
}: RoleGuardProps) {
  const { user, ready, hasAccess } = useAuth();

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1140px] px-5 py-20 text-center text-muted-foreground">
        Verifying session and Row Level Security policy...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-[640px] px-5 py-20">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
            <Lock className="h-6 w-6" />
          </div>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-1">
            Authentication Required
          </span>
          <h1 className="font-serif text-3xl font-medium text-foreground mb-3">
            Sign in to access {featureTitle}
          </h1>
          <p className="text-[16px] text-muted-foreground leading-relaxed mb-6">
            This clinical module is protected by role-based access control and
            Row Level Security. Please sign in with an authorized account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <span>Go to Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess(feature)) {
    const homeHref = ROLE_HOME_ROUTE[user.role];
    return (
      <div className="mx-auto max-w-[680px] px-5 py-20">
        <div className="rounded-2xl border border-[#C0504D]/40 bg-[#C0504D]/[0.06] p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C0504D]/15 text-[#C0504D]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C0504D] mb-1">
                Row Level Security · Access Restricted
              </span>
              <h1 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-2">
                {ROLE_LABELS[user.role]} role cannot access {featureTitle}
              </h1>
              <p className="text-[16px] text-foreground/85 leading-relaxed mb-6">
                Signed in as <strong>{user.email}</strong> (
                <strong>{ROLE_LABELS[user.role]}</strong>). Both database Row
                Level Security policies and route permissions restrict{" "}
                <strong>{featureTitle}</strong> to authorized roles only.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={homeHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  <span>Go to {ROLE_LABELS[user.role]} Home</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-[14px] font-medium text-foreground hover:bg-card transition-colors"
                >
                  Switch Role Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

