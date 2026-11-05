import type { TransitionGate } from "../../features/order-status/gate-schema";
import type { OrderStatusFlags, StatusEvent } from "../../features/order-status/schema";

export type OrderStatusTemplateStatus = {
  name: string;
  color: string;
  event?: StatusEvent | null;
  /** The gates on moves into this status from any status (ADR 0076), e.g. a reason for Lost. */
  gatesIn?: readonly TransitionGate[];
} & Partial<OrderStatusFlags>;

/**
 * Order statuses an organization can import and then edit freely (ADR 0043). Domain words live
 * only in this data. Orders move freely between a template's statuses (ADR 0076).
 */
export type OrderStatusTemplate = {
  key: string;
  name: string;
  statuses: readonly OrderStatusTemplateStatus[];
};
