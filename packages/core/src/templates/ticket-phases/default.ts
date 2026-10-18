import { forwardTransitions, type TicketPhaseTemplate } from "./ticket-phase-template";

const phases: TicketPhaseTemplate["phases"] = [
  { name: "Lead", color: "#f59e0b", entry: true },
  { name: "Confirmed", color: "#16a34a", requiresAssignee: true },
  {
    name: "Completed",
    color: "#2563eb",
    terminal: true,
    requiresAssignee: true,
    invoiceable: true,
  },
  { name: "Lost", color: "#6b7280", terminal: true, requiresReason: true },
];

/**
 * The minimum working pipeline (ADR 0043): one entry phase, one open phase and two terminal ones.
 * Every new organization gets it at creation, so tickets work immediately.
 */
export const defaultTicketPhases: TicketPhaseTemplate = {
  key: "default",
  name: "Default",
  phases,
  transitions: forwardTransitions({ phases }),
};
