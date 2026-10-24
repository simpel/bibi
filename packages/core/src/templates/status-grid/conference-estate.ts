import { cellsIn, type StatusGridTemplate } from "./status-grid-template";

const SOFT_STATUSES = ["New", "Site visit", "Quote sent"];

/**
 * The grid of ADR 0044's example on the "Conference estate" statuses: rooms are prebooked until the
 * deal and booked from Confirmed, food is estimated, ordered and then locked at the final count,
 * and other lines are planned and then confirmed. Cells left out keep the state.
 */
export const conferenceEstateStatusGrid: StatusGridTemplate = {
  key: "conference-estate",
  name: "Conference estate",
  cells: [
    ...cellsIn({ statuses: SOFT_STATUSES, states: ["Prebooked", "Estimated", "Planned"] }),
    ...cellsIn({ statuses: ["Confirmed"], states: ["Booked", "Ordered", "Confirmed"] }),
    ...cellsIn({ statuses: ["Final count locked"], states: ["Locked"] }),
  ],
};
