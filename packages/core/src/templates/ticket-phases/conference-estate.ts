import { forwardTransitions, type TicketPhaseTemplate } from "./ticket-phase-template";

const phases: TicketPhaseTemplate["phases"] = [
  { name: "New", color: "#f59e0b", entry: true },
  { name: "Site visit", color: "#d97706" },
  { name: "Quote sent", color: "#7c3aed", event: "QUOTE_SENT" },
  { name: "Confirmed", color: "#16a34a", requiresAssignee: true, event: "QUOTE_ACCEPTED" },
  { name: "Final count locked", color: "#0d9488", requiresAssignee: true },
  {
    name: "Completed",
    color: "#2563eb",
    terminal: true,
    requiresAssignee: true,
    invoiceable: true,
  },
  { name: "Lost", color: "#6b7280", terminal: true, requiresReason: true },
  { name: "Cancelled", color: "#9ca3af", terminal: true, requiresReason: true },
];

/**
 * "Conference estate" (ADR 0043): eight phases from the first enquiry to a completed, lost or
 * cancelled ticket; every move forward and to a terminal phase is allowed until the ticket ends.
 */
export const conferenceEstateTicketPhases: TicketPhaseTemplate = {
  key: "conference-estate",
  name: "Conference estate",
  phases,
  transitions: forwardTransitions({ phases }),
};
