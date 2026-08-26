import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function SafetyPage() {
  await requireUser("manage_safety");
  const [alerts, maintenance, sensors] = await Promise.all([
    prisma.safetyAlert.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.maintenanceEvent.findMany({ orderBy: { dueAt: "asc" } }),
    prisma.sensorDevice.findMany({ include: { readings: { orderBy: { readAt: "desc" }, take: 1 } } }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader title="Safety & Maintenance" description="ORBIT monitors alerts and maintenance work. It does not replace certified physical safety equipment or trained adult operators." />
      <Card className="border-amber-200 bg-amber-50">
        <p className="font-semibold text-amber-950">
          Safety-critical shutdowns must be handled by local hardware and trained adult operators. ORBIT does not replace certified physical safety equipment.
        </p>
      </Card>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="text-lg font-bold">Alerts</h2>
          <div className="mt-4 grid gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-md border border-slate-200 p-3">
                <Badge tone={alert.severity === "CRITICAL" ? "red" : alert.severity === "WARNING" ? "amber" : "green"}>{alert.severity}</Badge>
                <p className="mt-2 font-semibold">{alert.type}</p>
                <p className="text-sm text-slate-600">{alert.message}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Maintenance</h2>
          <div className="mt-4 grid gap-3">
            {maintenance.map((event) => (
              <div key={event.id} className="rounded-md border border-slate-200 p-3">
                <Badge tone={event.severity === "CRITICAL" ? "red" : "amber"}>{event.severity}</Badge>
                <p className="mt-2 font-semibold">{event.eventType}</p>
                <p className="text-sm text-slate-600">Due {event.dueAt.toISOString().slice(0, 10)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Sensors</h2>
          <div className="mt-4 grid gap-3">
            {sensors.map((sensor) => (
              <div key={sensor.id} className="rounded-md border border-slate-200 p-3">
                <Badge tone={sensor.simulated ? "amber" : "green"}>{sensor.simulated ? "SIMULATED" : "VERIFIED"}</Badge>
                <p className="mt-2 font-semibold">{sensor.label}</p>
                <p className="text-sm text-slate-600">{sensor.readings[0]?.value ?? "No"} {sensor.readings[0]?.unit ?? "readings"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
