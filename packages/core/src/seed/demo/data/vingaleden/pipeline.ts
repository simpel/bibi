import type { DemoGridCell } from "../../types";

/**
 * Vingaleden's phase grid on the default phases until its own phases are seeded (#271). Add-ons
 * have no cells: they keep their state.
 */
export const vingaledenPipeline: readonly DemoGridCell[] = [
  { phase: "Lead", type: "Boat", state: "Prebooked" },
  { phase: "Lead", type: "Skipper", state: "Prebooked" },
  { phase: "Lead", type: "Tour", state: "Planned" },
  { phase: "Confirmed", type: "Boat", state: "Booked" },
  { phase: "Confirmed", type: "Skipper", state: "Booked" },
  { phase: "Confirmed", type: "Tour", state: "Confirmed" },
];
