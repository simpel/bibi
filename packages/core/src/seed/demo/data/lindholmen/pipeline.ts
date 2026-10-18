import { conferenceEstateTicketPhases } from "../../../../templates/ticket-phases/conference-estate";
import type { DemoGridCell, DemoPipeline } from "../../types";

type Row = { phases: readonly string[]; type: string; state: string };

const rows: readonly Row[] = [
  ...["New", "Site visit", "Quote sent"].flatMap((phase) => [
    { phases: [phase], type: "Conference room", state: "Prebooked" },
    { phases: [phase], type: "Tour", state: "Planned" },
    { phases: [phase], type: "Guide", state: "Planned" },
  ]),
  { phases: ["Confirmed"], type: "Conference room", state: "Booked" },
  { phases: ["Confirmed"], type: "Equipment", state: "Booked" },
  { phases: ["Confirmed"], type: "Dish", state: "Ordered" },
  { phases: ["Confirmed"], type: "Meal", state: "Ordered" },
  { phases: ["Confirmed"], type: "Tour", state: "Confirmed" },
  { phases: ["Confirmed"], type: "Guide", state: "Confirmed" },
];

const cells: readonly DemoGridCell[] = rows.flatMap(({ phases, type, state }) =>
  phases.map((phase) => ({ phase, type, state })),
);

/**
 * Lindholmen's pipeline (`docs/demo-seed.md`, Ticket phases and Item states and the phase grid):
 * the "Conference estate" phases, and a grid that books rooms and equipment, orders food and
 * confirms tours from Confirmed on. Cells left out keep the state: food and equipment before the
 * deal, drinks throughout.
 */
export const lindholmenPipeline: DemoPipeline = {
  phases: conferenceEstateTicketPhases,
  cells,
};
