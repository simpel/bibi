import type { JobDefinition } from "./job-definition";
import { expireDueOptionsJob } from "./jobs/expire-due-options";
import { pseudonymiseAuditLogJob } from "./jobs/pseudonymise-audit-log";

/** Every job the worker runs. Add new jobs here. */
export const JOBS: readonly JobDefinition[] = [expireDueOptionsJob, pseudonymiseAuditLogJob];
