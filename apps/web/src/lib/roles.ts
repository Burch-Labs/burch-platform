/**
 * Role checks, in one place.
 *
 * SUPER_ADMIN was added after most of the codebase already spelled its admin
 * checks as `role === "ADMIN"` directly. Rather than hunt down and rewrite
 * every one — and risk missing one, silently locking a super admin out of a
 * screen a plain admin can already reach — new gates should call these, and
 * existing ones get swapped in as they're touched. isAdminRole is additive by
 * design: SUPER_ADMIN passes it too, because it's a strict superset.
 */
import type { UserRole } from "@prisma/client";

export function isAdminRole(role: UserRole | string | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: UserRole | string | undefined | null): boolean {
  return role === "SUPER_ADMIN";
}
