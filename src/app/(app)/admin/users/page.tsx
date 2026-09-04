import { AddPartnerForm } from "@/components/add-partner-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function UsersPage() {
  await requireUser("manage_system");
  const organisations = await prisma.organisation.findMany({
    include: { memberships: { include: { user: true } }, school: true, facility: true, contributor: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Organisations & Users"
        description="Register newly partnered schools, community biogas hubs, and user accounts. Active partnerships automatically sync to public pages."
      />
      <AddPartnerForm />
      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-black">Registered Partner Organisations ({organisations.length})</h2>
        {organisations.map((org) => (
          <Card key={org.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-black">{org.name}</h2>
                <p className="text-sm text-slate-500">{org.slug}</p>
              </div>
              <Badge tone={org.type === "SCHOOL" ? "blue" : org.type === "COMMUNITY_PARTNER" ? "green" : "purple"}>
                {org.type}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {org.memberships.map((membership) => (
                <div key={membership.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-black">{membership.user.name}</p>
                  <p className="text-slate-500">{membership.user.email}</p>
                  <Badge tone={membership.role === "SUPER_ADMIN" ? "purple" : "slate"}>{membership.role}</Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
