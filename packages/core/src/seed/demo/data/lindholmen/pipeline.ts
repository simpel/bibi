import { conferenceEstateTicketStatuses } from "../../../../templates/ticket-statuses/conference-estate";
import type { DemoGridCell, DemoPipeline } from "../../types";
import { lindholmenBoards } from "./boards";

type Row = { statuses: readonly string[]; type: string; state: string };

const rows: readonly Row[] = [
  ...["New", "Site visit", "Quote sent"].flatMap((ticketStatus) => [
    { statuses: [ticketStatus], type: "Conference room", state: "Prebooked" },
    { statuses: [ticketStatus], type: "Tour", state: "Planned" },
    { statuses: [ticketStatus], type: "Guide", state: "Planned" },
  ]),
  { statuses: ["Confirmed"], type: "Conference room", state: "Booked" },
  { statuses: ["Confirmed"], type: "Equipment", state: "Booked" },
  { statuses: ["Confirmed"], type: "Dish", state: "Ordered" },
  { statuses: ["Confirmed"], type: "Meal", state: "Ordered" },
  { statuses: ["Confirmed"], type: "Tour", state: "Confirmed" },
  { statuses: ["Confirmed"], type: "Guide", state: "Confirmed" },
];

const cells: readonly DemoGridCell[] = rows.flatMap(({ statuses, type, state }) =>
  statuses.map((ticketStatus) => ({ ticketStatus, type, state })),
);

/**
 * Lindholmen's pipeline (`docs/demo-seed.md`, Ticket statuses and Item states and the status grid):
 * the "Conference estate" statuses, and a grid that books rooms and equipment, orders food and
 * confirms tours from Confirmed on. Cells left out keep the state: food and equipment before the
 * deal, drinks throughout. Two boards beyond the default one (`./boards`).
 */
export const lindholmenPipeline: DemoPipeline = {
  statuses: conferenceEstateTicketStatuses,
  cells,
  boards: lindholmenBoards,
};
