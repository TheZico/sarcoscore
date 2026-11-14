"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { DEMO_USERS } from "@/data/seed";
import { ROLE_LABELS, ROLE_HOME_ROUTE } from "@/lib/rls";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Check,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

const MATRIX_ROWS = [
  {
    feature: "Dashboard",
    admin: true,
    doctor: true,
    researcher: false,
    patient: false,
  },
  {
    feature: "Create & review",
    admin: true,
    doctor: true,
    researcher: false,
    patient: false,
  },
  {
    feature: "Patient profile",
    admin: true,
    doctor: true,
    researcher: false,
    patient: false,
  },
  {
    feature: "Research & insights",
    admin: true,
    doctor: false,
    researcher: true,
    patient: false,
  },
  {
    feature: "System management",
    admin: true,
    doctor: false,
    researcher: false,
    patient: false,
  },
  {
    feature: "My Health (own data only)",
    admin: false,
    doctor: false,
    researcher: false,
    patient: true,
  },
];

export default function LoginPage() {
  const { login, user, logout } = useAuth();
  const [email, setEmail] = useState("doctor@sarcoscore.demo");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      login(email, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed. Please try again."
      );
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPassword: string) => {
    setError(null);
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      login(demoEmail, demoPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  };

  return (
    <div className="mx-auto max-w-[1140px] px-5 py-12 md:px-10 md:py-20 lg:px-16">
      <motion.div {...fadeUp} className="mb-10 border-b border-border pb-6">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
          SARCOSCORE · ROLE-BASED CLINICAL ACCESS
        </span>
        <h1 className="font-serif text-3xl md:text-[42px] font-medium text-foreground leading-[1.14]">
          Sign in to SarcoScore
        </h1>
        <p className="mt-2.5 text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
          Email and password authentication with Supabase Row Level Security
          enforcement across four roles: Administrator, Doctor, Researcher, and
          Patient.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Email + Password Login Form */}
        <motion.div {...fadeUp} className="lg:col-span-5">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-mockup">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Credentials
                </span>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Email &amp; Password Login
                </h2>
              </div>
            </div>

            {user && (
              <div className="mb-5 rounded-xl border border-primary/30 bg-primary/[0.08] p-4 text-[14px]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Active Session
                    </span>
                    <p className="font-semibold text-foreground">{user.fullName}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {user.email} · Role: <strong>{ROLE_LABELS[user.role]}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-card"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#C0504D]/40 bg-[#C0504D]/10 p-3.5 text-[14px] text-[#C0504D]">
                <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[14px] font-semibold text-foreground mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@sarcoscore.demo"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[14px] font-semibold text-foreground mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[16px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <span>Sign in &amp; go to role home</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-4 text-[12px] text-muted-foreground">
              Demo data only. Never enter real patient identifiers or real
              clinical credentials.
            </p>
          </div>
        </motion.div>

        {/* Right: 4 Demo Role Accounts + RLS Permissions Table */}
        <motion.div {...fadeUp} className="lg:col-span-7 space-y-6">
          {/* One-Click Demo Accounts (1 per role) */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <UserCheck className="h-5 w-5 text-primary" />
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Seeded Demo Accounts (One Per Role)
                </span>
                <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground">
                  Select a Role to Sign In Immediately
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DEMO_USERS.map((demo) => {
                const isCurrent = user?.email === demo.email;
                return (
                  <div
                    key={demo.id}
                    className={cn(
                      "rounded-xl border p-4 flex flex-col justify-between transition-colors",
                      isCurrent
                        ? "border-primary bg-primary/[0.08]"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="inline-flex items-center rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                          {ROLE_LABELS[demo.role]}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Home: {ROLE_HOME_ROUTE[demo.role]}
                        </span>
                      </div>
                      <p className="text-[15px] font-semibold text-foreground">
                        {demo.fullName}
                      </p>
                      <p className="text-[12px] font-mono text-muted-foreground mt-0.5">
                        {demo.email} · pw: {demo.password}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin(demo.email, demo.password)}
                      className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                    >
                      <span>Sign in as {ROLE_LABELS[demo.role]}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RLS Permissions Matrix */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Row Level Security Policy Matrix
                </span>
                <h2 className="font-serif text-xl font-medium text-foreground">
                  Enforced Permissions by Role
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-border bg-card/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Feature / Module</th>
                    <th className="py-3 px-3 text-center">Admin</th>
                    <th className="py-3 px-3 text-center">Doctor</th>
                    <th className="py-3 px-3 text-center">Researcher</th>
                    <th className="py-3 px-3 text-center">Patient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MATRIX_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td className="py-2.5 px-4 font-medium text-foreground">
                        {row.feature}
                      </td>
                      {(["admin", "doctor", "researcher", "patient"] as const).map(
                        (r) => {
                          const allowed = row[r];
                          return (
                            <td key={r} className="py-2.5 px-3 text-center">
                              {allowed ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#2E8B57]/15 px-2 py-0.5 text-[11px] font-semibold text-[#2E8B57]">
                                  <Check className="h-3 w-3" />Y
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  <XIcon className="h-3 w-3" />N
                                </span>
                              )}
                            </td>
                          );
                        }
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

