import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  AuditLogIdInputSchema,
  AuditLogListInputSchema,
  AuditLogListOutputSchema,
  AuditLogSchema,
} from "./schema";
import { toAuditEntries } from "./to-audit-entries";
import { visibleAuditWhere } from "./visibility";
import { auditLogWhere } from "./where";

export const listAuditLogs = defineOperation({
  name: "auditLog.list",
  kind: "query",
  description:
    "Change history (audit log), newest first: who changed what, whether the assistant (AI) " +
    "proposed it and who approved, with the before and after image. Filter on entity " +
    "(entityType + entityId), actor, conversation, request or time range.",
  input: AuditLogListInputSchema,
  output: AuditLogListOutputSchema,
  permission: "audit:view",
  handler: async ({ input: { limit, cursor, ...filters }, context }) => {
    const rows = await context.db.auditLog.findMany({
      where: { AND: [auditLogWhere({ filters }), visibleAuditWhere({ context })] },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageArgs({ limit, cursor }),
    });
    const page = paginate({ rows, limit });
    return ok({ value: { ...page, items: await toAuditEntries({ context, rows: page.items }) } });
  },
});

export const getAuditLog = defineOperation({
  name: "auditLog.get",
  kind: "query",
  description: "Get one audit log entry by id, with its full before and after image.",
  input: AuditLogIdInputSchema,
  output: AuditLogSchema,
  permission: "audit:view",
  handler: async ({ input, context }) => {
    const row = await context.db.auditLog.findFirst({
      where: { AND: [{ id: input.id }, visibleAuditWhere({ context })] },
    });
    if (!row) return notFound({ entity: "Audit log entry" });
    const [entry] = await toAuditEntries({ context, rows: [row] });
    return entry ? ok({ value: entry }) : notFound({ entity: "Audit log entry" });
  },
});

export const auditLogOperations = [listAuditLogs, getAuditLog];
