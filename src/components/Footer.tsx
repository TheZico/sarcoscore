"use client";

import React from "react";
import Link from "next/link";
import model from "@/data/model.json";
import { useAuth } from "@/lib/auth";
import { canUseQuickCalculator } from "@/lib/rls";
import { Stethoscope, ShieldAlert } from "lucide-react";

export function Footer() {
  const { user } = useAuth();
  const canUseCalc = canUseQuickCalculator(user);

  return (
    <footer className="no-print bg-sage-deep text-[#F5F2EA] border-t border-border pb-20 md:pb-0">
      {/* Always-visible Clinical Model Disclaimer Banner */}
      <div className="border-b border-white/10 bg-black/15">
        <div className="mx-auto max-w-[1140px] px-5 py-4 md:px-10 lg:px-16 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#E3A21A]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5D07E] border border-[#E3A21A]/30">
            <ShieldAlert className="h-3.5 w-3.5" />
            Clinical Notice
          </span>
          <p className="text-[14px] leading-relaxed text-[#F5F2EA]/90">
            {model.disclaimer}
          </p>
        </div>
      </div>

      {/* Main 4-Column Footer */}
      <div className="mx-auto max-w-[1140px] px-5 py-16 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Product */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-[#A8C9B9]">
                <Stethoscope className="h-4 w-4" />
              </span>
              <span className="font-serif text-lg font-medium text-[#F5F2EA]">
                SarcoScore
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-[#F5F2EA]/70">
              Helping medical doctors suspect sarcoidosis earlier through structured symptom and laboratory decision support.
            </p>
          </div>

          {/* Column 2: Product Links */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A8C9B9] mb-4">
              Product
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#F5F2EA]/80">
              {canUseCalc ? (
                <li>
                  <Link href="/check" className="hover:text-white transition-colors">
                    Check a Patient
                  </Link>
                </li>
              ) : !user ? (
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Login to Platform
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href="/insights" className="hover:text-white transition-colors">
                  Dataset Insights ({model.stats.total_cases} Cases)
                </Link>
              </li>
              <li>
                <Link href="/method" className="hover:text-white transition-colors">
                  How the Score Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Project & Team */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A8C9B9] mb-4">
              Project & Team
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#F5F2EA]/80">
              <li>
                <Link href="/#team" className="hover:text-white transition-colors">
                  Student Research Team
                </Link>
              </li>
              <li>
                <Link href="/method" className="hover:text-white transition-colors">
                  Points-Based Scoring Model
                </Link>
              </li>
              <li>
                <Link href="/insights" className="hover:text-white transition-colors">
                  Case Cohort Analysis
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Scope & Limitations */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A8C9B9] mb-4">
              Scope & Limitations
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#F5F2EA]/80">
              <li>
                <Link href="/method#limitations" className="hover:text-white transition-colors">
                  Prototype Limitations
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & General Information Disclaimer */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[13px] text-[#F5F2EA]/65">
          <div>(c) 2026 SarcoScore · Student Research Prototype.</div>
          <div className="max-w-xl md:text-right">
            This website provides general information. Clinical findings are decision support only and are not medical advice.
          </div>
        </div>
      </div>
    </footer>
  );
}
