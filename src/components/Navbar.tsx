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
import { AppFeature, ROLE_LABELS } from "@/lib/rls";

interface NavItem {
  href: string;
  label: string;
  feature?: AppFeature;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard", feature: "dashboard" },
  { href: "/cases/new", label: "Create & Review", feature: "create_review" },
  { href: "/research", label: "Research & Insights", feature: "research_insights" },
  { href: "/admin", label: "System Management", feature: "system_management" },
  { href: "/my-health", label: "My Health", feature: "my_health" },
  { href: "/check", label: "Quick Calculator" },
  { href: "/method", label: "How It Works" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, hasAccess } = useAuth();

  const visibleLinks = ALL_NAV_ITEMS.filter((item) => {
    if (!item.feature) return true;
    return hasAccess(item.feature);
  });

  return (
    <header className="no-print sticky top-0 z-50 h-[76px] w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-5 md:px-10 lg:px-16">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground focus:outline-none shrink-0"
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
        <nav
          className="hidden lg:flex items-center gap-5"
          aria-label="Main navigation"
        >
          {visibleLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "sage-link text-[14px] font-normal transition-colors whitespace-nowrap",
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

        {/* Right Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.08] px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/15 transition-colors"
                title={`Signed in as ${user.email}`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>{ROLE_LABELS[user.role]}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground hover:bg-background transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex lg:hidden items-center justify-center rounded-lg p-2 text-foreground hover:bg-card focus:outline-none"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-border bg-background px-5 pt-3 pb-6">
          <nav className="flex flex-col space-y-2">
            {visibleLinks.map((link) => {
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
                    "rounded-lg px-3 py-2 text-[15px] font-medium",
                    isActive
                      ? "bg-card text-primary"
                      : "text-foreground/85 hover:bg-card/60"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {user ? (
                <>
                  <div className="px-3 py-1.5 text-[13px] text-muted-foreground">
                    Signed in as{" "}
                    <strong className="text-foreground">{user.email}</strong> (
                    {ROLE_LABELS[user.role]})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="block w-full rounded-lg border border-border bg-card py-2.5 text-center text-[14px] font-medium text-foreground"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full rounded-lg bg-primary py-2.5 text-center text-[15px] font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
