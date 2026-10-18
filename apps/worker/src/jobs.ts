import type { JobDefinition } from "./job-definition";
import { expireTicketHoldsJob } from "./jobs/expire-ticket-holds";
import { pseudonymiseAuditLogJob } from "./jobs/pseudonymise-audit-log";

/** Every job the worker runs. Add new jobs here. */
export const JOBS: readonly JobDefinition[] = [expireTicketHoldsJob, pseudonymiseAuditLogJob];
