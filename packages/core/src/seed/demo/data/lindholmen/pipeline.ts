import type { DemoGridCell } from "../../types";

/**
 * Lindholmen's phase grid (`docs/demo-seed.md`, Item states and the phase grid) on the default
 * phases until the organization's own phases are seeded (#271). Cells left out keep the state:
 * food and equipment in Lead, drinks in Confirmed.
 */
export const lindholmenPipeline: readonly DemoGridCell[] = [
  { phase: "Lead", type: "Conference room", state: "Prebooked" },
  { phase: "Lead", type: "Tour", state: "Planned" },
  { phase: "Lead", type: "Guide", state: "Planned" },
  { phase: "Confirmed", type: "Conference room", state: "Booked" },
  { phase: "Confirmed", type: "Equipment", state: "Booked" },
  { phase: "Confirmed", type: "Dish", state: "Ordered" },
  { phase: "Confirmed", type: "Meal", state: "Ordered" },
  { phase: "Confirmed", type: "Tour", state: "Confirmed" },
  { phase: "Confirmed", type: "Guide", state: "Confirmed" },
];
