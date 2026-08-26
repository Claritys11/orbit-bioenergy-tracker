import Link from "next/link";
import { createConversionFormAction } from "@/app/actions";
import { Button, Card, Field, PageHeader, SelectField, TextareaField } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";
import { formatGas, formatKg } from "@/lib/utils";

export default async function ConversionsPage() {
  await requireUser("record_conversion");
  const [facilities, batches, cycles] = await Promise.all([
    prisma.partnerFacility.findMany({ include: { organisation: true } }),
    prisma.wasteBatch.findMany({ where: { status: { in: ["ACCEPTED", "CONDITIONAL"] } }, include: { inspection: true, sourceOrganisation: true } }),
    prisma.conversionCycle.findMany({ include: { facility: { include: { organisation: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader title="Conversion Cycles" description="Record batches entering conversion and verified gas output. Estimated batch gas is shown separately from measured output." />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-lg font-bold">Record verified gas cycle</h2>
          <form action={createConversionFormAction} className="mt-4 grid gap-4">
            <SelectField label="Facility" name="facilityId" required options={facilities.map((facility) => ({ value: facility.id, label: facility.organisation.name }))} />
            <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold">Accepted batches</legend>
              {batches.map((batch) => (
                <label key={batch.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="batchIds" value={batch.id} />
                  {batch.batchCode} - {batch.sourceOrganisation.name} - {formatKg(batch.inspection?.acceptedMassKg ?? 0)}
                </label>
              ))}
            </fieldset>
            <Field label="Verified gas output (m3)" name="verifiedGasM3" type="number" step="0.01" min="0" required />
            <Field label="Operational use (m3)" name="operationalUseM3" type="number" step="0.01" min="0" required />
            <Field label="Safety reserve (m3)" name="safetyReserveM3" type="number" step="0.01" min="0" required />
            <Field label="Digestate output (kg)" name="digestateOutputKg" type="number" step="0.1" min="0" required />
            <SelectField label="Measurement source" name="measurementSource" required options={[
              { value: "MANUAL", label: "Manual verified log" },
              { value: "SENSOR_SIMULATED", label: "Sensor simulated" },
              { value: "SENSOR_VERIFIED", label: "Sensor verified" },
            ]} />
            <TextareaField label="Notes" name="notes" required defaultValue="Verified gas record. Estimated gas remains separate." />
            <Button>Save conversion cycle</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Cycles</h2>
          <div className="mt-4 grid gap-3">
            {cycles.map((cycle) => (
              <Link key={cycle.id} href={`/operations/conversions/${cycle.id}`} className="rounded-md border border-slate-200 p-4 hover:bg-[var(--orbit-primary)]/8">
                <p className="font-semibold text-[var(--orbit-primary)]">{cycle.cycleCode}</p>
                <p className="text-sm text-slate-600">{cycle.facility.organisation.name}</p>
                <p className="mt-2 text-sm">Verified {formatGas(cycle.verifiedGasM3)} - allocatable {formatGas(cycle.allocatableGasM3)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
