import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type Permission } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";

export async function requireUser(permission?: Permission) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (permission && !can(session.user.role as Role, permission)) redirect("/not-authorized");
  return session.user;
}
