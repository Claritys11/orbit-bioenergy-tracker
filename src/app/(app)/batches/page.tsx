import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatKg, humanise } from "@/lib/utils";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";

export default async function BatchesPage() {
  const user = await requireUser();
  const batches = await prisma.wasteBatch.findMany({
    where:
      user.role === "SUPER_ADMIN" || user.role === "OPERATOR"
        ? {}
        : { sourceOrganisationId: user.organisationId },
    include: { category: true, sourceOrganisation: true, inspection: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Waste Batch Register"
        description="Trace every organic-waste batch from source registration through pickup, inspection, conversion, allocation, and closure."
        action={<LinkButton href="/batches/new">Create batch</LinkButton>}
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Batch code</th>
                <th>Source</th>
                <th>Category</th>
                <th>Status</th>
                <th>Gross</th>
                <th>Accepted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td className="py-3">
                    <Link className="font-semibold text-[var(--orbit-primary)]" href={`/batches/${batch.id}`}>
                      {batch.batchCode}
                    </Link>
                  </td>
                  <td>{batch.sourceOrganisation.name}</td>
                  <td>{batch.category.name}</td>
                  <td><Badge tone={batch.status === "REJECTED" ? "red" : batch.status === "CONDITIONAL" ? "amber" : "green"}>{humanise(batch.status)}</Badge></td>
                  <td>{formatKg(batch.grossWeightKg)}</td>
                  <td>{batch.inspection ? formatKg(batch.inspection.acceptedMassKg) : "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
