import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog({
  actorId,
  entityType,
  entityId,
  action,
  metadata,
}: {
  actorId?: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      actorId,
      entityType,
      entityId,
      action,
      metadataJson: metadata,
    },
  });
}
