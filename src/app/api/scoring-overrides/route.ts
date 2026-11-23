import { NextRequest, NextResponse } from "next/server";
import {
  loadDb,
  getScoringOverrides,
  getEffectiveScoringConfig,
  saveSymptomOverride,
  saveLabOverride,
  resetScoringOverridesToModelDefaults,
} from "@/lib/db";
import { RLSViolationError, type SessionUser, type UserRole } from "@/lib/rls";
import { ValidationError } from "@/lib/validation";

const VALID_ROLES = new Set<UserRole>([
  "admin",
  "doctor",
  "researcher",
  "patient",
]);

function resolveRequestUser(request: NextRequest): SessionUser | null {
  const roleCookie = request.cookies.get("sarcoscore_role")?.value as
    | UserRole
    | undefined;
  const uidCookie = request.cookies.get("sarcoscore_uid")?.value;

  const db = loadDb();
  if (uidCookie) {
    const byId = db.users.find((u) => u.id === uidCookie);
    if (byId && (!roleCookie || byId.role === roleCookie)) {
      return {
        id: byId.id,
        email: byId.email,
        fullName: byId.fullName,
        role: byId.role,
        linkedPatientId: byId.linkedPatientId,
      };
    }
  }

  if (roleCookie && VALID_ROLES.has(roleCookie)) {
    const byRole = db.users.find((u) => u.role === roleCookie);
    if (byRole) {
      return {
        id: byRole.id,
        email: byRole.email,
        fullName: byRole.fullName,
        role: byRole.role,
        linkedPatientId: byRole.linkedPatientId,
      };
    }
  }

  return null;
}

/**
 * GET /api/scoring-overrides
 * Authenticated roles can read overrides and merged scoring settings.
 */
export async function GET(request: NextRequest) {
  const user = resolveRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }
  return NextResponse.json({
    overrides: getScoringOverrides(),
    effective: getEffectiveScoringConfig(),
  });
}

/**
 * POST /api/scoring-overrides
 * Admin-only endpoint to create/update a symptom or lab override with server-side validation.
 * Rejects Doctor, Researcher, Patient (403) and unauthenticated requests (401).
 */
export async function POST(request: NextRequest) {
  const user = resolveRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    if (body.itemType === "symptom") {
      const saved = saveSymptomOverride(user, String(body.itemId ?? ""), body.points);
      return NextResponse.json({
        override: saved,
        effective: getEffectiveScoringConfig(),
      });
    }

    if (body.itemType === "lab") {
      const saved = saveLabOverride(user, String(body.itemId ?? ""), {
        low: body.low,
        high: body.high,
        max_points: body.max_points,
      });
      return NextResponse.json({
        override: saved,
        effective: getEffectiveScoringConfig(),
      });
    }

    return NextResponse.json(
      { error: 'itemType must be "symptom" or "lab".' },
      { status: 400 }
    );
  } catch (err) {
    if (err instanceof RLSViolationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Could not save scoring override." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scoring-overrides
 * Admin-only endpoint to reset all overrides back to model.json defaults.
 */
export async function DELETE(request: NextRequest) {
  const user = resolveRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    resetScoringOverridesToModelDefaults(user);
    return NextResponse.json({
      reset: true,
      effective: getEffectiveScoringConfig(),
    });
  } catch (err) {
    if (err instanceof RLSViolationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Could not reset scoring overrides." },
      { status: 500 }
    );
  }
}
