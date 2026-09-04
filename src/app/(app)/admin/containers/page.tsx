import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { humanise } from "@/lib/utils";
import { ContainerQrTag } from "@/components/container-qr-tag";
import { createContainerFormAction, revokeContainerAction } from "@/app/actions";

export default async function AdminContainersPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { selected } = await searchParams;

  const [containers, organisations, sources, categories] = await Promise.all([
    prisma.wasteContainer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organisation: true,
        source: true,
        category: true,
        batches: { select: { id: true } },
      },
    }),
    prisma.organisation.findMany({ orderBy: { name: "asc" } }),
    prisma.wasteSource.findMany({ orderBy: { name: "asc" } }),
    prisma.feedstockCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const selectedContainer = selected
    ? containers.find((c) => c.id === selected || c.containerCode === selected)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="QR Container Issuance & Management"
        description="Issue and manage persistent digital identities for reusable physical waste containers across schools, markets, and supporting contributors."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Issue Container Form Card */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-950">Issue New Container Tag</h2>
          <p className="mt-1 text-xs text-slate-500">
            Generate a persistent digital QR token bound to a physical container.
          </p>

          <form action={createContainerFormAction} className="mt-4 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Target Organisation *
              <select
                name="organisationId"
                required
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
              >
                {organisations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Waste Source Location *
              <select
                name="sourceId"
                required
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
              >
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name} ({src.sourceType})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Capacity Limit (kg)
              <input
                type="number"
                name="capacityKg"
                defaultValue={50}
                step="5"
                min="5"
                max="1000"
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Notes / Hardware Label
              <input
                type="text"
                name="notes"
                placeholder="e.g. Bin #04 - Green Heavy Duty 50L"
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
              />
            </label>

            <Button type="submit" variant="primary" className="mt-2">
              ✨ Issue Container & Generate QR
            </Button>
          </form>
        </Card>

        {/* Containers List Table */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Active & Issued Containers</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Total Issued: {containers.length} containers
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="p-3">Container ID</th>
                  <th className="p-3">Organisation & Source</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Cycles</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {containers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{c.containerCode}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{c.organisation.name}</p>
                      <p className="text-xs text-slate-500">{c.source.name}</p>
                    </td>
                    <td className="p-3">{c.category.name}</td>
                    <td className="p-3">
                      <Badge tone={c.status === "REVOKED" ? "red" : c.status === "READY_FOR_PICKUP" ? "amber" : "green"}>
                        {humanise(c.status)}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">{c.batches.length}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-2">
                        <a
                          href={`/c/${c.qrToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          👁️ View Tag
                        </a>
                        {c.status !== "REVOKED" ? (
                          <form
                            action={async () => {
                              "use server";
                              await revokeContainerAction(c.id, "Admin revoked");
                            }}
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Revoke
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Selected Container Printable Preview Modal / Card */}
      {selectedContainer ? (
        <Card className="mt-8 border-2 border-[var(--orbit-primary)] bg-slate-50 p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Print Tag Preview: {selectedContainer.containerCode}</h2>
          <ContainerQrTag
            containerCode={selectedContainer.containerCode}
            qrToken={selectedContainer.qrToken}
            orgName={selectedContainer.organisation.name}
            sourceName={selectedContainer.source.name}
            categoryName={selectedContainer.category.name}
            capacityKg={selectedContainer.capacityKg}
          />
        </Card>
      ) : null}
    </div>
  );
}
