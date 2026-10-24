import { forwardTransitions, type TicketStatusTemplate } from "./ticket-status-template";

const statuses: TicketStatusTemplate["statuses"] = [
  { name: "Lead", color: "#f59e0b", entry: true },
  { name: "Confirmed", color: "#16a34a", requiresAssignee: true },
  {
    name: "Completed",
    color: "#2563eb",
    closes: true,
    requiresAssignee: true,
    invoiceable: true,
  },
  { name: "Lost", color: "#6b7280", closes: true, requiresReason: true },
];

/**
 * The minimum working pipeline (ADR 0043): one entry status, one open status and two closing ones.
 * Every new organization gets it at creation, so tickets work immediately.
 */
export const defaultTicketStatuses: TicketStatusTemplate = {
  key: "default",
  name: "Default",
  statuses,
  transitions: forwardTransitions({ statuses }),
};
