import type { JobDefinition } from "./job-definition";
import { heartbeat } from "./jobs/heartbeat";
import { pseudonymiseAuditLogJob } from "./jobs/pseudonymise-audit-log";

/** Every job the worker runs. Add new jobs here. */
export const JOBS: readonly JobDefinition[] = [heartbeat, pseudonymiseAuditLogJob];
