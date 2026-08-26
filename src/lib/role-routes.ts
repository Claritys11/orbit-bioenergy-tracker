import type { Role } from "@/lib/domain/types";

const dashboardByRole: Record<Role, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  SCHOOL_ADMIN: "/school/dashboard",
  CANTEEN_STAFF: "/canteen/dashboard",
  STUDENT: "/student/dashboard",
  OPERATOR: "/operator/dashboard",
  COMMUNITY_PARTNER: "/community/dashboard",
};

export function roleDashboardPath(role: Role) {
  return dashboardByRole[role];
}

