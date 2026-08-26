import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function FacilitiesPage() {
  await requireUser("manage_org");
  const facilities = await prisma.partnerFacility.findMany({ include: { organisation: true, vehicles: true } });
  return (
    <div className="grid gap-6">
      <PageHeader title="Facility Management" description="TPS3R/KSM capability is explicit. Facilities are not automatically treated as biodigester-ready." />
      <div className="grid gap-4 md:grid-cols-2">
        {facilities.map((facility) => (
          <Card key={facility.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{facility.organisation.name}</h2>
                <p className="text-sm text-slate-600">{facility.facilityType}</p>
              </div>
              <Badge tone={facility.biodigesterStatus === "PILOT_PARTNER" ? "green" : "amber"}>{facility.biodigesterStatus}</Badge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Capacity</dt><dd className="font-semibold">{facility.capacityKgPerDay} kg/day</dd></div>
              <div><dt className="text-slate-500">Energy mode</dt><dd className="font-semibold">{facility.energyMode}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">Feedstock</dt><dd className="font-semibold">{facility.supportedFeedstock.join(", ")}</dd></div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
