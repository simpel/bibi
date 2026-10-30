import { forwardTransitions, type TicketStatusTemplate } from "./ticket-status-template";

const statuses: TicketStatusTemplate["statuses"] = [
  { name: "New", color: "#f59e0b", entry: true },
  { name: "Site visit", color: "#d97706" },
  { name: "Quote sent", color: "#7c3aed", event: "QUOTE_SENT" },
  { name: "Confirmed", color: "#16a34a", event: "QUOTE_ACCEPTED", gatesIn: ["ASSIGNEE"] },
  {
    name: "Final count locked",
    color: "#0d9488",
    gatesIn: ["ASSIGNEE", "ACCEPTED_QUOTE"],
  },
  {
    name: "Completed",
    color: "#2563eb",
    closes: true,
    invoiceable: true,
    gatesIn: ["ASSIGNEE"],
  },
  { name: "Lost", color: "#6b7280", closes: true, gatesIn: ["REASON"] },
  { name: "Cancelled", color: "#9ca3af", closes: true, gatesIn: ["REASON"] },
];

/**
 * "Conference estate" (ADR 0043): eight statuses from the first enquiry to a completed, lost or
 * cancelled ticket; every move forward and to a closing status is allowed until the ticket ends.
 */
export const conferenceEstateTicketStatuses: TicketStatusTemplate = {
  key: "conference-estate",
  name: "Conference estate",
  statuses,
  transitions: forwardTransitions({ statuses }),
};
