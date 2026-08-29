/**
 * Global account roles.
 *
 * Club membership is separate and lives in `club_members` (president,
 * vice_president, event_manager, member); those are scoped to one club and are
 * not represented here.
 */
export const ACCOUNT_ROLES = [
  "super_admin",
  "admin",
  "teacher",
  "club",
  "student",
] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export function isAccountRole(value: unknown): value is AccountRole {
  return (
    typeof value === "string" &&
    (ACCOUNT_ROLES as readonly string[]).includes(value)
  );
}

/**
 * Roles an invite can grant.
 *
 * Deliberately excludes `super_admin`: that tier is only reachable through
 * an existing super_admin editing a user directly, never through a link.
 * `student` is excluded too, since that is what normal sign-up assigns.
 */
export const INVITABLE_ROLES = ["admin", "teacher"] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export function isInvitableRole(value: unknown): value is InvitableRole {
  return (
    typeof value === "string" &&
    (INVITABLE_ROLES as readonly string[]).includes(value)
  );
}

export const ROLE_LABELS: Record<AccountRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  teacher: "Teacher",
  club: "Club",
  student: "Student",
};

export function roleLabel(role: string) {
  return isAccountRole(role) ? ROLE_LABELS[role] : role;
}

/* ------------------------------------------------------------------ *
 * Capabilities
 *
 * What each role is allowed to do, in one place, so a permission check is
 * never a hand-written role comparison scattered through a route.
 * ------------------------------------------------------------------ */

/** Administer the site: users, clubs, invites, the admin dashboard. */
export function canAdminister(roles: readonly string[]) {
  return roles.includes("admin") || roles.includes("super_admin");
}

/**
 * Publish course material: presigned uploads, file records, the upload page.
 *
 * This is what `teacher` grants. The role previously existed in the invite
 * form but was read by nothing, so an invited teacher got an account with no
 * abilities at all. Teaching staff contribute coursework, so that is the
 * capability it maps to. Deliberately NOT administration: a teacher cannot
 * reach the admin dashboard, edit users, manage clubs, or issue invites.
 */
export function canUploadResources(roles: readonly string[]) {
  return canAdminister(roles) || roles.includes("teacher");
}
