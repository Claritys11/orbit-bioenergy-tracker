import type { Role } from "./types";

export type Permission =
  | "manage_system"
  | "manage_org"
  | "manage_containers"
  | "issue_qr"
  | "create_waste_record"
  | "create_batch"
  | "view_batches"
  | "request_pickup"
  | "respond_pickup_request"
  | "manage_pickup_logistics"
  | "inspect_batch"
  | "record_conversion"
  | "calculate_allocation"
  | "fulfil_allocation"
  | "view_reports"
  | "view_audit"
  | "manage_safety"
  | "view_student";

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "manage_system",
    "manage_org",
    "manage_containers",
    "issue_qr",
    "create_waste_record",
    "create_batch",
    "view_batches",
    "request_pickup",
    "respond_pickup_request",
    "manage_pickup_logistics",
    "inspect_batch",
    "record_conversion",
    "calculate_allocation",
    "fulfil_allocation",
    "view_reports",
    "view_audit",
    "manage_safety",
  ],
  SCHOOL_ADMIN: [
    "manage_org",
    "view_reports",
    "view_audit",
    "view_batches",
    "request_pickup",
  ],
  CANTEEN_STAFF: [
    "create_waste_record",
    "create_batch",
    "view_batches",
    "view_reports",
  ],
  STUDENT: [
    "view_student",
    "view_reports",
  ],
  OPERATOR: [
    "respond_pickup_request",
    "manage_pickup_logistics",
    "inspect_batch",
    "record_conversion",
    "calculate_allocation",
    "fulfil_allocation",
    "manage_safety",
    "view_reports",
    "view_batches",
  ],
  COMMUNITY_PARTNER: [
    "view_reports",
  ],
};

export function can(role: Role, permission: Permission) {
  const perms = rolePermissions[role] ?? [];
  if (permission === "create_batch" && perms.includes("create_waste_record")) return true;
  return perms.includes(permission);
}

export function assertPermission(role: Role, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error("You are not authorised to perform this action.");
  }
}

export const permissionsByRole = rolePermissions;
