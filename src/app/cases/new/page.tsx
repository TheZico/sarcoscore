"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import {
  createPatientFile,
  listPatientsForDashboard,
  listAllVisitsForClinical,
} from "@/lib/db";
import { isValidNationalId } from "@/lib/rls";
import {
  UserPlus,
  ArrowRight,
  AlertCircle,
  FolderOpen,
  IdCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

export default function CreateReviewCasePage() {
  const { user } = useAuth();
  const router = useRouter();

  // New Patient File state
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [gender, setGender] = useState<"Female" | "Male">("Female");
  const [dob, setDob] = useState("1980-05-15");
  const [phone, setPhone] = useState("+20 100 ");
  const [historySummary, setHistorySummary] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setRefreshTick] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("sarcoscore-db-updated", refreshData);
    return () => window.removeEventListener("sarcoscore-db-updated", refreshData);
  }, [refreshData]);

  const canRead =
    user && (user.role === "admin" || user.role === "doctor");
  const patients = canRead ? listPatientsForDashboard(user) : [];
  const allVisits = canRead ? listAllVisitsForClinical(user) : [];

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!isValidNationalId(nationalId)) {
      setError(
        "Egyptian National ID must be exactly 14 digits (numbers only)."
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const created = createPatientFile(user, {
        fullName,
        nationalId,
        gender,
        dob,
        phone,
        historySummary,
      });
      // Navigate using internal ID (never national_id) and open visit scorer
      router.push(`/patients/${created.id}?visit=new`);
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not create patient file.");
    }
  };

  const handleFillSyntheticPatient = () => {
    const randomSuffix = String(Math.floor(100000 + Math.random() * 900000));
    setFullName("Nourhan Tarek El-Gendy (Demo)");
    setNationalId(`282091401${randomSuffix.slice(0, 5)}`);
    setGender("Female");
    setDob("1982-09-14");
    setPhone("+20 100 555 2040");
    setHistorySummary(
      "44-year-old female presenting with persistent dry cough for 4 months, bilateral ankle pain, and hilar prominence on chest X-ray."
    );
    setError(null);
  };

  const digitsCount = nationalId.replace(/\D/g, "").length;

  return (
    <RoleGuard feature="create_review" featureTitle="Create & Review Case">
      <div className="mx-auto max-w-[1140px] px-5 py-10 md:px-10 md:py-16 lg:px-16">
        {/* Header */}
        <motion.div {...fadeUp} className="mb-8 border-b border-border pb-6">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-2">
            CLINICAL WORKPLACE · CREATE &amp; REVIEW CASE
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-[40px] font-medium text-foreground leading-[1.14]">
                Create and Review Case
              </h1>
              <p className="mt-2 text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
                Create a new patient file (with a 14-digit fake National ID),
                then open the file to enter symptoms and laboratory
                investigations for sarcoidosis likelihood scoring.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-background transition-colors"
            >
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): New Patient File Creation Form (shown directly, no tabs) */}
          <motion.div {...fadeUp} className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-mockup">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Registered Patient Record
                    </span>
                    <h2 className="font-serif text-xl font-medium text-foreground">
                      New Patient File
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFillSyntheticPatient}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-card transition-colors"
                >
                  Fill fake demo patient
                </button>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#C0504D]/40 bg-[#C0504D]/10 p-3.5 text-[14px] text-[#C0504D]">
                  <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div>
                  <label
                    htmlFor="np-fullname"
                    className="block text-[14px] font-semibold text-foreground mb-1"
                  >
                    Full name *
                  </label>
                  <input
                    id="np-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Amina Farouk El-Masry"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="np-national-id"
                      className="text-[14px] font-semibold text-foreground flex items-center gap-1.5"
                    >
                      <IdCard className="h-4 w-4 text-primary" />
                      <span>National ID (exactly 14 digits, fake only) *</span>
                    </label>
                    <span
                      className={cn(
                        "text-[12px] font-mono font-semibold",
                        digitsCount === 14
                          ? "text-[#2E8B57]"
                          : "text-muted-foreground"
                      )}
                    >
                      {digitsCount} / 14 digits
                    </span>
                  </div>
                  <input
                    id="np-national-id"
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    required
                    value={nationalId}
                    onChange={(e) =>
                      setNationalId(e.target.value.replace(/\D/g, "").slice(0, 14))
                    }
                    placeholder="28405120109912"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 font-mono text-[15px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="mt-1 block text-[12px] text-muted-foreground">
                    Never shown in route URLs. Internal IDs are used for all
                    links.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="np-gender"
                      className="block text-[14px] font-semibold text-foreground mb-1"
                    >
                      Gender *
                    </label>
                    <select
                      id="np-gender"
                      value={gender}
                      onChange={(e) =>
                        setGender(e.target.value as "Female" | "Male")
                      }
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="np-dob"
                      className="block text-[14px] font-semibold text-foreground mb-1"
                    >
                      Date of birth *
                    </label>
                    <input
                      id="np-dob"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="np-phone"
                      className="block text-[14px] font-semibold text-foreground mb-1"
                    >
                      Phone number *
                    </label>
                    <input
                      id="np-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="np-history"
                    className="block text-[14px] font-semibold text-foreground mb-1"
                  >
                    Medical history summary *
                  </label>
                  <textarea
                    id="np-history"
                    rows={3}
                    required
                    value={historySummary}
                    onChange={(e) => setHistorySummary(e.target.value)}
                    placeholder="Brief presenting complaints, duration of symptoms, prior imaging or comorbidities..."
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[16px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  <span>
                    Create Patient File &amp; Enter Symptoms / Labs
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>

          {/* Right Column (5 cols): Quick Review of Existing Patient Files */}
          <motion.div {...fadeUp} className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <FolderOpen className="h-5 w-5 text-primary" />
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Review Existing Cases
                  </span>
                  <h2 className="font-serif text-xl font-medium text-foreground">
                    Open a Patient File ({patients.length})
                  </h2>
                </div>
              </div>

              <div className="space-y-2.5">
                {patients.map((pat) => {
                  const patVisits = allVisits.filter(
                    (v) => v.patientId === pat.id
                  );
                  const latest = patVisits[0];
                  const pct = latest ? Math.round(latest.probability * 100) : null;
                  return (
                    <Link
                      key={pat.id}
                      href={`/patients/${pat.id}`}
                      className="block rounded-xl border border-border bg-background p-3.5 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold text-primary">
                              {pat.patientCode}
                            </span>
                            <span className="text-[14px] font-semibold text-foreground">
                              {pat.fullName}
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5">
                            {pat.gender} · DOB {pat.dob} ·{" "}
                            {patVisits.length} visit
                            {patVisits.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        {latest && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
                              latest.level === "High"
                                ? "bg-[#C0504D]/12 text-[#C0504D] border-[#C0504D]/30"
                                : latest.level === "Moderate"
                                ? "bg-[#E3A21A]/15 text-[#9A6B08] border-[#E3A21A]/40"
                                : "bg-[#2E8B57]/12 text-[#2E8B57] border-[#2E8B57]/30"
                            )}
                          >
                            {pct}% {latest.level}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </RoleGuard>
  );
}
