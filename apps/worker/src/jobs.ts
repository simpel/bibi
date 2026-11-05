import type { JobDefinition } from "./job-definition";
import { expireOrderHoldsJob } from "./jobs/expire-order-holds";
import { pseudonymiseAuditLogJob } from "./jobs/pseudonymise-audit-log";
import { refreshIntegrationsJob } from "./jobs/refresh-integrations";

/** Every job the worker runs. Add new jobs here. */
export const JOBS: readonly JobDefinition[] = [
  expireOrderHoldsJob,
  pseudonymiseAuditLogJob,
  refreshIntegrationsJob,
];
