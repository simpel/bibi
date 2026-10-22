import { getEnv } from "@bibi/config";
import { pseudonymiseAuditLog } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import type { JobDefinition } from "../job-definition";

const DAY = 86_400_000;

/**
 * Redacts personal values in `AuditLog.before`/`after` once rows are older than
 * `AUDIT_LOG_PSEUDONYMISE_AFTER_DAYS` (ADR 0032). Nightly, as SYSTEM; rows are kept.
 */
export const pseudonymiseAuditLogJob: JobDefinition = {
  name: "system.pseudonymiseAuditLog",
  cron: "30 3 * * *",
  handler: async ({ db }) => {
    const days = getEnv().AUDIT_LOG_PSEUDONYMISE_AFTER_DAYS;
    const createdBefore = new Date(Date.now() - days * DAY);
    const { pseudonymised } = await pseudonymiseAuditLog({ db, createdBefore });
    getLogger().info({ event: "auditLog.pseudonymised", count: pseudonymised, days });
  },
};
