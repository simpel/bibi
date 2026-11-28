import { lineStateReconciliation, orderStatusReconciliation } from "./history-reconcile";
import { lineHoldsReconciliation } from "./line-holds-reconcile";
import { type ReconcileContext, runReconciliations } from "./reconcile";
import { recordReconciliation } from "./record-reconciliation";
import { recordRelationsReconciliation } from "./record-relations-reconcile";
import { paymentRefundReconciliation } from "./refund-reconcile";
import { runSheetCurrentReconciliation } from "./run-sheet-current-reconcile";
import { taskHoldsReconciliation } from "./task-holds-reconcile";
import { taskStatusReconciliation } from "./task-status-reconcile";

export const RECONCILIATIONS = [
  lineHoldsReconciliation,
  taskHoldsReconciliation,
  taskStatusReconciliation,
  recordReconciliation,
  recordRelationsReconciliation,
  orderStatusReconciliation,
  lineStateReconciliation,
  paymentRefundReconciliation,
  runSheetCurrentReconciliation,
];

/** Runs every registered projection check (ADR 0051); also called from Vitest. */
export const reconcileProjections = ({ context }: ReconcileContext) =>
  runReconciliations({ context, checks: RECONCILIATIONS });
