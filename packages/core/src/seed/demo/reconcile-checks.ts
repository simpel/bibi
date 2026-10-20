import { lineStateReconciliation, ticketPhaseReconciliation } from "./history-reconcile";
import { lineHoldsReconciliation } from "./line-holds-reconcile";
import { type ReconcileContext, runReconciliations } from "./reconcile";
import { recordReconciliation } from "./record-reconciliation";

export const RECONCILIATIONS = [
  lineHoldsReconciliation,
  recordReconciliation,
  ticketPhaseReconciliation,
  lineStateReconciliation,
];

/** Runs every registered projection check (ADR 0051); also called from Vitest. */
export const reconcileProjections = ({ context }: ReconcileContext) =>
  runReconciliations({ context, checks: RECONCILIATIONS });
