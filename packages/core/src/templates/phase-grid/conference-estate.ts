import { cellsIn, type PhaseGridTemplate } from "./phase-grid-template";

const SOFT_PHASES = ["New", "Site visit", "Quote sent"];

/**
 * The grid of ADR 0044's example on the "Conference estate" phases: rooms are prebooked until the
 * deal and booked from Confirmed, food is estimated, ordered and then locked at the final count,
 * and other lines are planned and then confirmed. Cells left out keep the state.
 */
export const conferenceEstatePhaseGrid: PhaseGridTemplate = {
  key: "conference-estate",
  name: "Conference estate",
  cells: [
    ...cellsIn({ phases: SOFT_PHASES, states: ["Prebooked", "Estimated", "Planned"] }),
    ...cellsIn({ phases: ["Confirmed"], states: ["Booked", "Ordered", "Confirmed"] }),
    ...cellsIn({ phases: ["Final count locked"], states: ["Locked"] }),
  ],
};
