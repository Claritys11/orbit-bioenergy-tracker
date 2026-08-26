import { redirect } from "next/navigation";
import { roleDashboardPath } from "@/lib/role-routes";
import { requireUser } from "@/lib/services/authz";

export default async function DashboardRedirectPage() {
  const user = await requireUser();
  redirect(roleDashboardPath(user.role));
}

