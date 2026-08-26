import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/services/authz";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="grid gap-6">
      <PageHeader title="Profile" description="Session and role context for this ORBIT demo account." />
      <Card>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-slate-500">Name</dt><dd className="font-semibold">{user.name}</dd></div>
          <div><dt className="text-slate-500">Email</dt><dd className="font-semibold">{user.email}</dd></div>
          <div><dt className="text-slate-500">Role</dt><dd className="font-semibold">{user.role}</dd></div>
          <div><dt className="text-slate-500">Organisation</dt><dd className="font-semibold">{user.organisationName}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
