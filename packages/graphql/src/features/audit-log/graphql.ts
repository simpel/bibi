import { type AuditLogDto, AuditLogSchema, getAuditLog, listAuditLogs } from "@okazi/core";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const AuditLogRef = objectFromSchema<AuditLogDto>({
  name: "AuditLog",
  schema: AuditLogSchema,
  omit: ["organizationId"],
  description:
    "Audit log entry – one change: actor (user, AI, system), operation and before/after.",
});
const AuditLogPageRef = pageType({ name: "AuditLogPage", item: AuditLogRef });

fieldFromOperation({ operation: listAuditLogs, type: AuditLogPageRef, name: "auditLogs" });
fieldFromOperation({ operation: getAuditLog, type: AuditLogRef, name: "auditLog" });
