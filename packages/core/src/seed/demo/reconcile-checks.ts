import { lineStateReconciliation, ticketStatusReconciliation } from "./history-reconcile";
import { lineHoldsReconciliation } from "./line-holds-reconcile";
import { type ReconcileContext, runReconciliations } from "./reconcile";
import { recordReconciliation } from "./record-reconciliation";
import { paymentRefundReconciliation } from "./refund-reconcile";
import { workOrderCurrentReconciliation } from "./work-order-current-reconcile";

export const RECONCILIATIONS = [
  lineHoldsReconciliation,
  recordReconciliation,
  ticketStatusReconciliation,
  lineStateReconciliation,
  paymentRefundReconciliation,
  workOrderCurrentReconciliation,
];

/** Runs every registered projection check (ADR 0051); also called from Vitest. */
export const reconcileProjections = ({ context }: ReconcileContext) =>
  runReconciliations({ context, checks: RECONCILIATIONS });
