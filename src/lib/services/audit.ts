import { prisma } from "@/lib/db";

export async function audit(data: {
  actorId?: string;
  organisationId?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId,
      organisationId: data.organisationId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      before: data.before === undefined ? undefined : JSON.parse(JSON.stringify(data.before)),
      after: data.after === undefined ? undefined : JSON.parse(JSON.stringify(data.after)),
      reason: data.reason,
    },
  });
}
