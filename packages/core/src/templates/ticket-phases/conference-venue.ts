import { forwardTransitions, type TicketPhaseTemplate } from "./ticket-phase-template";

const phases: TicketPhaseTemplate["phases"] = [
  { name: "Tentative", color: "#f59e0b", entry: true },
  { name: "Confirmed", color: "#16a34a", requiresAssignee: true },
  { name: "Final count locked", color: "#0d9488", requiresAssignee: true },
  {
    name: "Completed",
    color: "#2563eb",
    terminal: true,
    requiresAssignee: true,
    invoiceable: true,
  },
  { name: "Cancelled", color: "#6b7280", terminal: true, requiresReason: true },
];

/**
 * "Conference venue" (ADR 0043): five phases; every move forward and to a terminal phase is
 * allowed until the ticket is completed or cancelled.
 */
export const conferenceVenueTicketPhases: TicketPhaseTemplate = {
  key: "conference-venue",
  name: "Conference venue",
  phases,
  transitions: forwardTransitions({ phases }),
};
