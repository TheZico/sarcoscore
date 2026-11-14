export type UserRole = "admin" | "doctor" | "researcher" | "patient";

export type AppFeature =
  | "dashboard"
  | "create_review"
  | "patient_profile"
  | "research_insights"
  | "system_management"
  | "my_health";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  linkedPatientId?: string;
}

/**
 * Exact Role Permissions Matrix from Specification:
 * | Feature             | Admin | Doctor | Researcher | Patient |
 * | Dashboard           | Y     | Y      | N          | N       |
 * | Create & review     | Y     | Y      | N          | N       |
 * | Patient profile     | Y     | Y      | N          | N       |
 * | Research & insights | Y     | N      | Y          | N       |
 * | System management   | Y     | N      | N          | N       |
 * | My Health           | N     | N      | N          | Y       |
 */
export const ROLE_PERMISSIONS: Record<UserRole, Record<AppFeature, boolean>> = {
  admin: {
    dashboard: true,
    create_review: true,
    patient_profile: true,
    research_insights: true,
    system_management: true,
    my_health: false,
  },
  doctor: {
    dashboard: true,
    create_review: true,
    patient_profile: true,
    research_insights: false,
    system_management: false,
    my_health: false,
  },
  researcher: {
    dashboard: false,
    create_review: false,
    patient_profile: false,
    research_insights: true,
    system_management: false,
    my_health: false,
  },
  patient: {
    dashboard: false,
    create_review: false,
    patient_profile: false,
    research_insights: false,
    system_management: false,
    my_health: true,
  },
};

export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  admin: "/dashboard",
  doctor: "/dashboard",
  researcher: "/research",
  patient: "/my-health",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  researcher: "Researcher",
  patient: "Patient",
};

export class RLSViolationError extends Error {
  public readonly code = "RLS_POLICY_VIOLATION";
  constructor(message: string) {
    super(message);
    this.name = "RLSViolationError";
  }
}

export function canAccessFeature(
  user: SessionUser | null | undefined,
  feature: AppFeature
): boolean {
  if (!user) return false;
  return Boolean(ROLE_PERMISSIONS[user.role]?.[feature]);
}

export function assertFeatureAccess(
  user: SessionUser | null | undefined,
  feature: AppFeature
): SessionUser {
  if (!user) {
    throw new RLSViolationError(
      `RLS denied: unauthenticated access to "${feature}".`
    );
  }
  if (!canAccessFeature(user, feature)) {
    throw new RLSViolationError(
      `RLS denied: role "${user.role}" cannot access "${feature}".`
    );
  }
  return user;
}

/**
 * Row-level check for Patient "My Health":
 * A patient may ONLY read rows belonging to their own linked patient record.
 */
export function assertPatientOwnRecord(
  user: SessionUser | null | undefined,
  targetPatientId: string
): SessionUser {
  const verified = assertFeatureAccess(user, "my_health");
  if (verified.linkedPatientId !== targetPatientId) {
    throw new RLSViolationError(
      `RLS denied: patient "${verified.email}" attempted to read record "${targetPatientId}" (own record is "${verified.linkedPatientId}").`
    );
  }
  return verified;
}

/**
 * Validates Egyptian National ID format (exactly 14 digits).
 */
export function isValidNationalId(nationalId: string): boolean {
  return /^[0-9]{14}$/.test(nationalId.trim());
}

