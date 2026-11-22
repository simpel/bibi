import type { OperationContext, RecordedChange } from "../../operations/types";
import { captureOrderVersion } from "./capture";

/** Entity types whose changes may change an order's content (ADR 0116). */
const CONTENT_TYPES = new Set(["line", "alternativeGroup", "order"]);

const orderIdOf = ({ value }: { value: unknown }): string | null => {
  if (!value || typeof value !== "object") return null;
  const { orderId } = value as { orderId?: unknown };
  return typeof orderId === "string" ? orderId : null;
};

export type CaptureChangedInput = {
  context: Pick<OperationContext, "db" | "actor" | "now" | "organizationId">;
  /** The command's own entity type: a change without one belongs to it. */
  entityType: string;
  changes: readonly RecordedChange[];
};

/**
 * After a command, in its transaction: captures a version of every order whose lines, alternative
 * groups or own row it changed (ADR 0116). An order with unchanged content gets nothing.
 */
export async function captureChangedOrders({ context, entityType, changes }: CaptureChangedInput) {
  const orderIds = new Set<string>();
  for (const change of changes) {
    const type = change.entityType ?? entityType;
    if (!CONTENT_TYPES.has(type)) continue;
    const id =
      type === "order"
        ? change.entityId
        : (orderIdOf({ value: change.after }) ?? orderIdOf({ value: change.before }));
    if (id) orderIds.add(id);
  }
  for (const orderId of orderIds) await captureOrderVersion({ context, orderId });
}
