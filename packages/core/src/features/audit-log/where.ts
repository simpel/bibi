import type { Prisma } from "@okazi/db";
import type { AuditLogListInput } from "./schema";

type Filters = Omit<AuditLogListInput, "limit" | "cursor">;

export type AuditLogWhereInput = { filters: Filters };

/** List filters → Prisma `where`. Exact matches on ids so the indexes are used. */
export function auditLogWhere({ filters }: AuditLogWhereInput): Prisma.AuditLogWhereInput {
  const { entityType, entityId, actorType, actorId, conversationId, requestId, from, to } = filters;
  const range = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
  return {
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
    ...(actorType ? { actorType } : {}),
    ...(actorId ? { actorId } : {}),
    ...(conversationId ? { conversationId } : {}),
    ...(requestId ? { requestId } : {}),
    ...(from || to ? { createdAt: range } : {}),
  };
}
