import type { OrderStatusTemplate } from "./order-status-template";

const statuses: OrderStatusTemplate["statuses"] = [
  { name: "Lead", color: "#f59e0b", entry: true, tasks: true },
  { name: "Confirmed", color: "#16a34a", tasks: true, gatesIn: ["ASSIGNEE"] },
  {
    name: "Completed",
    color: "#2563eb",
    closes: true,
    invoiceable: true,
    gatesIn: ["ASSIGNEE"],
  },
  { name: "Lost", color: "#6b7280", closes: true, gatesIn: ["REASON"] },
];

/**
 * The minimum working pipeline (ADR 0043): one entry status, one open status and two closing ones.
 * Tasks can be in the open ones (ADR 0121).
 * Every new organization gets it at creation, so orders work immediately.
 */
export const defaultOrderStatuses: OrderStatusTemplate = {
  key: "default",
  name: "Default",
  statuses,
};
