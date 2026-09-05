import { createBatchFormAction } from "@/app/actions";
import { AlertBanner, Button, Card, Field, PageHeader, SelectField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function NewBatchPage() {
  const user = await requireUser("create_waste_record");
  const [containers, sources] = await Promise.all([
    user.organisationId
      ? prisma.wasteContainer.findMany({
          where: { organisationId: user.organisationId, isActive: true },
          include: { source: true, category: true },
          orderBy: { containerCode: "asc" },
        })
      : [],
    user.organisationId
      ? prisma.wasteSource.findMany({ where: { organisationId: user.organisationId } })
      : prisma.wasteSource.findMany(),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <Link href="/canteen/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Canteen Dashboard
        </Link>
      </div>

      <PageHeader
        title="Register Organic Waste"
        description="Select your assigned reusable container to mark today's organic load ready for pickup. Verified weighing and contamination inspection will be performed upon delivery at the Community Facility."
      />

      <AlertBanner tone="info" title="No Scale or Weighing Required at School">
        You don&apos;t need to weigh the waste here. The community waste-to-energy facility will perform calibrated physical weighing and inspection. Simply select your container, verify the contents are covered and separated, and mark it ready.
      </AlertBanner>

      <Card className="p-6">
        <form action={createBatchFormAction} className="grid gap-5 md:grid-cols-2">
          {containers.length > 0 ? (
            <div className="md:col-span-2">
              <SelectField
                label="Assigned Reusable Container *"
                name="containerId"
                required
                options={[
                  { value: "", label: "-- Select assigned reusable container --" },
                  ...containers.map((c) => ({
                    value: c.id,
                    label: `${c.containerCode} — ${c.source.name} [Capacity: ${c.capacityKg ?? 50} kg] (${c.status.replace(/_/g, " ")})`,
                  })),
                ]}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                The container tag identity automatically associates this load with your sorting bay and school account.
              </p>
            </div>
          ) : (
            <div className="md:col-span-2">
              <SelectField
                label="Waste Sorting Bay / Source *"
                name="sourceId"
                required
                options={sources.map((source) => ({ value: source.id, label: source.name }))}
              />
            </div>
          )}

          {/* Optional Details Accordion - Keeps Golden Path Clean */}
          <details className="group md:col-span-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors open:bg-slate-50/50">
            <summary className="cursor-pointer text-xs font-bold text-slate-700 hover:text-[var(--orbit-primary)] flex items-center justify-between select-none">
              <span>Optional Context & Photo (Click to expand)</span>
              <span className="text-slate-400 text-[10px] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            
            <div className="mt-4 grid gap-4 md:grid-cols-2 pt-3 border-t border-slate-100">
              {containers.length > 0 ? (
                <SelectField
                  label="Override Waste Source (Optional)"
                  name="sourceId"
                  options={[
                    { value: "", label: "Default from container" },
                    ...sources.map((source) => ({ value: source.id, label: source.name })),
                  ]}
                />
              ) : null}

              <Field
                label="Estimated mass (kg) — Unverified estimate"
                name="declaredMassKg"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 15.0 (Optional — official weighing done at facility scale)"
              />

              <Field
                label="Storage condition"
                name="storageStatus"
                defaultValue="Covered drum, labelled and source-separated"
              />

              <Field
                label="Collection / Ready timestamp"
                name="collectionTimestamp"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />

              <div className="md:col-span-2">
                <Field label="Optional Photo URL" name="photoUrl" type="url" placeholder="https://..." />
              </div>
            </div>
          </details>

          <div className="md:col-span-2 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <div>
              <p className="text-xs font-semibold text-slate-700">What happens next?</p>
              <p className="text-xs text-slate-500">
                The container will be marked <strong>Ready for Pickup</strong>. Your school administrator can bundle it into a collection request for operator dispatch.
              </p>
            </div>
            <Button className="shrink-0 font-bold px-6 min-h-11">
              <CheckCircle2 size={16} /> Mark Container Ready
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
