import type { Role } from "./types";

export type Permission =
  | "manage_system"
  | "manage_org"
  | "create_batch"
  | "view_student"
  | "schedule_pickup"
  | "inspect_batch"
  | "record_conversion"
  | "calculate_allocation"
  | "fulfil_allocation"
  | "view_reports"
  | "view_audit"
  | "manage_safety";

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "manage_system",
    "manage_org",
    "view_reports",
    "view_audit",
    "calculate_allocation",
    "manage_safety",
  ],
  SCHOOL_ADMIN: ["manage_org", "view_reports", "view_audit"],
  CANTEEN_STAFF: ["create_batch", "view_reports"],
  STUDENT: ["view_student"],
  OPERATOR: [
    "schedule_pickup",
    "inspect_batch",
    "record_conversion",
    "calculate_allocation",
    "fulfil_allocation",
    "view_reports",
    "manage_safety",
  ],
  COMMUNITY_PARTNER: ["view_reports"],
};

export function can(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function assertPermission(role: Role, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error("You are not authorised to perform this action.");
  }
}

export const permissionsByRole = rolePermissions;
