import type { JobDefinition } from "./job-definition";
import { eraseReservationBookersJob } from "./jobs/erase-reservation-bookers";
import { expireOrderHoldsJob } from "./jobs/expire-order-holds";
import { paymentRefundRetryJob } from "./jobs/payment-refund-retry";
import { providerPollJob } from "./jobs/provider-poll";
import { pseudonymiseAuditLogJob } from "./jobs/pseudonymise-audit-log";
import { purgeArchivesJob } from "./jobs/purge-archives";
import { refreshIntegrationsJob } from "./jobs/refresh-integrations";
import { remindReservationsJob } from "./jobs/remind-reservations";

/** Every job the worker runs. Add new jobs here. */
export const JOBS: readonly JobDefinition[] = [
  expireOrderHoldsJob,
  pseudonymiseAuditLogJob,
  refreshIntegrationsJob,
  providerPollJob,
  paymentRefundRetryJob,
  purgeArchivesJob,
  eraseReservationBookersJob,
  remindReservationsJob,
];
