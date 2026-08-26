import { ShieldAlert } from "lucide-react";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { roleDashboardPath } from "@/lib/role-routes";
import { requireUser } from "@/lib/services/authz";

export default async function NotAuthorizedPage() {
  const user = await requireUser();
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Not authorized"
        description="Your current role does not have access to that workspace feature."
        action={<LinkButton href={roleDashboardPath(user.role)}>Back to my dashboard</LinkButton>}
      />
      <Card>
        <ShieldAlert className="text-[var(--orbit-secondary)]" />
        <h2 className="mt-3 text-lg font-bold text-slate-950">Role access boundary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          ORBIT separates dashboards and operational tools by role, so users only see actions they are allowed to use.
        </p>
      </Card>
    </div>
  );
}
