"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Stethoscope,
  LogIn,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { UserRole, ROLE_LABELS } from "@/lib/rls";

interface NavItem {
  href: string;
  label: string;
}

/**
 * Single navigation config keyed by role (plus "guest" for logged-out visitors).
 * Each role renders only its own links.
 */
export const NAV_LINKS_BY_ROLE: Record<UserRole | "guest", NavItem[]> = {
  admin: [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/cases/new", label: "Create & Review" },
    { href: "/research", label: "Research & Insights" },
    { href: "/admin", label: "System Management" },
    { href: "/check", label: "Quick Calculator" },
    { href: "/method", label: "How It Works" },
  ],
  doctor: [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/cases/new", label: "Create & Review" },
    { href: "/check", label: "Quick Calculator" },
    { href: "/method", label: "How It Works" },
  ],
  researcher: [
    { href: "/", label: "Home" },
    { href: "/research", label: "Research & Insights" },
    { href: "/check", label: "Quick Calculator" },
    { href: "/method", label: "How It Works" },
  ],
  patient: [
    { href: "/", label: "Home" },
    { href: "/my-health", label: "My Health" },
    { href: "/method", label: "How It Works" },
  ],
  guest: [
    { href: "/", label: "Home" },
    { href: "/method", label: "How It Works" },
  ],
};

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const roleKey: UserRole | "guest" = user ? user.role : "guest";
  const visibleLinks = NAV_LINKS_BY_ROLE[roleKey];

  return (
    <header className="no-print sticky top-0 z-50 h-[76px] w-full bg-background/95 backdrop-blur-sm border-b border-border">
      {/* 3-Zone CSS Grid (1fr auto 1fr) at >=1440px so even Admin's 7 links stay centered with >=24px clearance on each side; collapses below 1440px */}
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-6 px-5 md:px-8 min-[1440px]:grid min-[1440px]:grid-cols-[1fr_auto_1fr] min-[1440px]:gap-x-6">
        {/* Left Zone: Logo and "SarcoScore / Clinical Platform", aligned left */}
        <div className="flex items-center justify-start justify-self-start min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground focus:outline-none shrink-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary border border-primary/20 shrink-0">
              <Stethoscope className="h-4.5 w-4.5" />
            </span>
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <span className="font-serif text-xl font-medium tracking-tight text-foreground">
                SarcoScore
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Clinical Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center Zone: Nav links, truly centered in the bar (>=1440px) */}
        <nav
          className="hidden min-[1440px]:flex items-center justify-center justify-self-center gap-6 2xl:gap-7"
          aria-label="Main navigation"
        >
          {visibleLinks.map((link) => {
            const isActive = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "sage-link text-sm font-normal transition-colors whitespace-nowrap",
                  isActive
                    ? "font-semibold text-primary"
                    : "text-foreground/80 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Zone: Role badge + Sign out (or Login) on desktop; Sign out + Hamburger below 1440px */}
        <div className="flex items-center justify-end justify-self-end gap-2.5 shrink-0">
          {user ? (
            <>
              <Link
                href="/login"
                className="hidden min-[1440px]:inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.08] px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/15 transition-colors whitespace-nowrap"
                title={`Signed in as ${user.email}`}
              >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>{ROLE_LABELS[user.role]}</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground hover:bg-background transition-colors whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover whitespace-nowrap"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span>Login</span>
            </Link>
          )}

          {/* Hamburger Button (shown below 1440px) */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex min-[1440px]:hidden items-center justify-center rounded-lg p-2 text-foreground hover:bg-card focus:outline-none"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsed Full-Width Dropdown Panel (<1440px) */}
      {mobileOpen && (
        <div className="min-[1440px]:hidden w-full border-b border-border bg-background px-5 pt-3 pb-6 shadow-mockup">
          <nav
            className="mx-auto max-w-[1440px] flex flex-col space-y-1.5"
            aria-label="Mobile navigation"
          >
            {visibleLinks.map((link) => {
              const isActive = isLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[15px] font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-card text-primary font-semibold"
                      : "text-foreground/85 hover:bg-card/60"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <div className="pt-3 mt-2 border-t border-border flex items-center justify-between px-3 py-1.5 text-[13px] text-muted-foreground">
                <span>
                  Signed in as{" "}
                  <strong className="text-foreground">{user.email}</strong>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <Shield className="h-3 w-3" />
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
