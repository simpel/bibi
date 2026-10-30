import {
  forwardTransitions,
  type TicketStatusTemplate,
} from "../../../../templates/ticket-statuses/ticket-status-template";
import type { DemoGridCell, DemoPipeline } from "../../types";

const statuses: TicketStatusTemplate["statuses"] = [
  { name: "Request", color: "#f59e0b", entry: true },
  { name: "Weather hold", color: "#0ea5e9" },
  { name: "Confirmed", color: "#16a34a", gatesIn: ["ASSIGNEE"] },
  { name: "Weather OK", color: "#0d9488", gatesIn: ["ASSIGNEE"] },
  { name: "Completed", color: "#2563eb", closes: true, invoiceable: true },
  { name: "Called off – weather", color: "#6b7280", closes: true, gatesIn: ["REASON"] },
  { name: "Cancelled", color: "#9ca3af", closes: true, gatesIn: ["REASON"] },
];

const SOFT = ["Request", "Weather hold"];
const BOOKED = ["Confirmed", "Weather OK"];

const cells: readonly DemoGridCell[] = [
  ...SOFT.flatMap((ticketStatus) => [
    { ticketStatus, type: "Boat", state: "Prebooked" },
    { ticketStatus, type: "Skipper", state: "Prebooked" },
    { ticketStatus, type: "Tour", state: "Planned" },
  ]),
  ...BOOKED.flatMap((ticketStatus) => [
    { ticketStatus, type: "Boat", state: "Booked" },
    { ticketStatus, type: "Skipper", state: "Booked" },
    { ticketStatus, type: "Tour", state: "Confirmed" },
  ]),
];

/**
 * Vingaleden's own tour-company statuses: a weather hold before the deal and a second weather
 * check after it. Add-ons have no cells: they keep their state.
 */
export const vingaledenPipeline: DemoPipeline = {
  statuses: {
    key: "tour-company",
    name: "Tour company",
    statuses,
    transitions: forwardTransitions({ statuses }),
  },
  cells,
};
