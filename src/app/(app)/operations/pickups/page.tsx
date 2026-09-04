import { OperatorPickupInbox } from "@/components/operator-pickup-inbox";
import { SchoolPickupRequestForm } from "@/components/school-pickup-request-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { can } from "@/lib/domain/rbac";
import type { Role } from "@/lib/domain/types";
import { requireUser } from "@/lib/services/authz";
import { formatKg, humanise } from "@/lib/utils";

export default async function PickupsPage() {
  const user = await requireUser();
  const role = user.role as Role;

  const isSchoolUser = can(role, "request_pickup") && role !== "SUPER_ADMIN";
  const isOperatorUser = can(role, "respond_pickup_request") || role === "SUPER_ADMIN";

  const [readyBatches, schoolRequests, operatorRequests, vehicles] = await Promise.all([
    isSchoolUser && user.organisationId
      ? prisma.wasteBatch.findMany({
          where: {
            sourceOrganisationId: user.organisationId,
            status: "READY_FOR_PICKUP",
            pickupRequestItem: null,
          },
          include: { category: true, container: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
    isSchoolUser && user.organisationId
      ? prisma.pickupRequest.findMany({
          where: { schoolOrganisationId: user.organisationId },
          include: {
            items: { include: { batch: { include: { category: true, container: true } } } },
            requestedByUser: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
    isOperatorUser
      ? prisma.pickupRequest.findMany({
          include: {
            schoolOrganisation: true,
            requestedByUser: true,
            items: { include: { batch: { include: { category: true, container: true } } } },
            pickup: { include: { vehicle: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
    isOperatorUser ? prisma.vehicle.findMany() : [],
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Organic Waste Pickup Operations"
        description="Demand collection & transport system connecting school canteen waste with bioenergy operator logistics."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Pickup Operations" },
        ]}
      />

      {isSchoolUser ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SchoolPickupRequestForm readyBatches={readyBatches} />

          <Card>
            <h2 className="text-lg font-bold text-black mb-1">School Pickup Request History</h2>
            <p className="text-sm text-slate-500 mb-4">
              Track the status of collection requests submitted by your school.
            </p>

            {schoolRequests.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No pickup requests submitted yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {schoolRequests.map((req) => {
                  const itemCount = req.items.length;
                  const totalMass = req.items.reduce((acc, i) => acc + (i.batch.grossWeightKg ?? i.batch.declaredMassKg ?? 0), 0);

                  let tone: "green" | "amber" | "red" | "blue" = "blue";
                  if (req.status === "PENDING_OPERATOR_RESPONSE") tone = "amber";
                  else if (req.status === "ACCEPTED" || req.status === "SCHEDULED") tone = "green";
                  else if (req.status === "REJECTED") tone = "red";

                  return (
                    <div key={req.id} className="rounded-md border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-500">{req.requestCode}</span>
                          <h3 className="font-bold text-sm text-black">
                            {itemCount} container load(s) &bull; {formatKg(totalMass)}
                          </h3>
                        </div>
                        <Badge tone={tone}>{humanise(req.status)}</Badge>
                      </div>

                      <div className="mt-2 text-xs text-slate-600">
                        <p>Requested: {new Date(req.requestedAt).toLocaleString()}</p>
                        <p>Proposed Window: {new Date(req.proposedPickupStart).toLocaleString()}</p>
                      </div>

                      {req.rejectionReason ? (
                        <div className="mt-2 rounded bg-red-50 p-2 text-xs font-medium text-red-800">
                          Rejection Feedback: &ldquo;{req.rejectionReason}&rdquo;
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {isOperatorUser ? <OperatorPickupInbox requests={operatorRequests} vehicles={vehicles} /> : null}
    </div>
  );
}
