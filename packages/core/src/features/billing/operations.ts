import { applyBillingSignal } from "./apply-signal-operation";
import { openBillingPortal, startBillingCheckout } from "./checkout-operations";
import { createBillingWebhookHandler } from "./create-billing-webhook-handler";
import { getBilling, getBillingAccess, listSeatRequests } from "./read-operations";
import { remindBillingAdmins } from "./remind-operation";
import { approveSeat, rejectSeat } from "./seat-operations";
import { syncBilling } from "./sync-operation";
import { updateBilling } from "./update-operation";

export {
  applyBillingSignal,
  approveSeat,
  createBillingWebhookHandler,
  getBilling,
  getBillingAccess,
  listSeatRequests,
  openBillingPortal,
  rejectSeat,
  remindBillingAdmins,
  startBillingCheckout,
  syncBilling,
  updateBilling,
};

/**
 * Bibi's own subscription per organization (ADR 0091, 0095). `billing.applySignal` is left out:
 * only the billing webhook runs it, as SYSTEM, like `integration.applySignal`.
 */
export const billingOperations = [
  getBilling,
  getBillingAccess,
  listSeatRequests,
  startBillingCheckout,
  openBillingPortal,
  syncBilling,
  updateBilling,
  approveSeat,
  rejectSeat,
  remindBillingAdmins,
];
