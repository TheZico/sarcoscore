import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_HOME_ROUTE, type UserRole } from "@/lib/rls";

const PROTECTED_ROUTE_ROLES: { prefix: string; allowed: UserRole[] }[] = [
  { prefix: "/dashboard", allowed: ["admin", "doctor"] },
  { prefix: "/cases", allowed: ["admin", "doctor"] },
  { prefix: "/patients", allowed: ["admin", "doctor"] },
  { prefix: "/research", allowed: ["admin", "researcher"] },
  { prefix: "/admin", allowed: ["admin"] },
  { prefix: "/my-health", allowed: ["patient"] },
  { prefix: "/check", allowed: ["admin", "doctor", "researcher"] },
];

const VALID_ROLES = new Set<UserRole>([
  "admin",
  "doctor",
  "researcher",
  "patient",
]);

/**
 * Server-side route protection middleware across all protected routes and Quick Calculator (/check).
 * - Unauthenticated (no session cookie): redirect to /login.
 * - Unauthorized role (e.g. Patient opening /check or /dashboard): redirect to that role's home route.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawRole = request.cookies.get("sarcoscore_role")?.value as
    | UserRole
    | undefined;
  const role = rawRole && VALID_ROLES.has(rawRole) ? rawRole : undefined;

  for (const rule of PROTECTED_ROUTE_ROLES) {
    if (
      pathname === rule.prefix ||
      pathname.startsWith(`${rule.prefix}/`)
    ) {
      if (!role) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
      }

      if (!rule.allowed.includes(role)) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = ROLE_HOME_ROUTE[role];
        homeUrl.search = "";
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/cases",
    "/cases/:path*",
    "/patients",
    "/patients/:path*",
    "/research",
    "/research/:path*",
    "/admin",
    "/admin/:path*",
    "/my-health",
    "/my-health/:path*",
    "/check",
    "/check/:path*",
  ],
};
