import {
  forwardTransitions,
  type TicketPhaseTemplate,
} from "../../../../templates/ticket-phases/ticket-phase-template";
import type { DemoGridCell, DemoPipeline } from "../../types";

const phases: TicketPhaseTemplate["phases"] = [
  { name: "Request", color: "#f59e0b", entry: true },
  { name: "Weather hold", color: "#0ea5e9" },
  { name: "Confirmed", color: "#16a34a", requiresAssignee: true },
  { name: "Weather OK", color: "#0d9488", requiresAssignee: true },
  { name: "Completed", color: "#2563eb", terminal: true, invoiceable: true },
  { name: "Called off – weather", color: "#6b7280", terminal: true, requiresReason: true },
  { name: "Cancelled", color: "#9ca3af", terminal: true, requiresReason: true },
];

const SOFT = ["Request", "Weather hold"];
const BOOKED = ["Confirmed", "Weather OK"];

const cells: readonly DemoGridCell[] = [
  ...SOFT.flatMap((phase) => [
    { phase, type: "Boat", state: "Prebooked" },
    { phase, type: "Skipper", state: "Prebooked" },
    { phase, type: "Tour", state: "Planned" },
  ]),
  ...BOOKED.flatMap((phase) => [
    { phase, type: "Boat", state: "Booked" },
    { phase, type: "Skipper", state: "Booked" },
    { phase, type: "Tour", state: "Confirmed" },
  ]),
];

/**
 * Vingaleden's own tour-company phases: a weather hold before the deal and a second weather
 * check after it. Add-ons have no cells: they keep their state.
 */
export const vingaledenPipeline: DemoPipeline = {
  phases: {
    key: "tour-company",
    name: "Tour company",
    phases,
    transitions: forwardTransitions({ phases }),
  },
  cells,
};
