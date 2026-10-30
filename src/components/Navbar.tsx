"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Stethoscope, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/check", label: "Check a patient" },
  { href: "/insights", label: "Insights" },
  { href: "/method", label: "How it works" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-50 h-[76px] w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-5 md:px-10 lg:px-16">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground focus:outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary border border-primary/20">
            <Stethoscope className="h-4.5 w-4.5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-xl font-medium tracking-tight text-foreground">
              SarcoScore
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Clinical Platform
            </span>
          </div>
        </Link>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "sage-link text-[15px] font-normal transition-colors",
                  isActive
                    ? "font-medium text-primary"
                    : "text-foreground/80 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/check"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <span>Check a patient</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-foreground hover:bg-card focus:outline-none"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-background px-5 pt-3 pb-6">
          <nav className="flex flex-col space-y-2.5">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[16px] font-medium",
                    isActive
                      ? "bg-card text-primary"
                      : "text-foreground/85 hover:bg-card/60"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border">
              <Link
                href="/check"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-lg bg-primary py-2.5 text-center text-[15px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                Check a patient
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
