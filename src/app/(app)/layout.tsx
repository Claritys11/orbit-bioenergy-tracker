import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/services/authz";
import type { ReactNode } from "react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell
      role={user.role}
      name={user.name}
      organisationName={user.organisationName}
    >
      {children}
    </AppShell>
  );
}
