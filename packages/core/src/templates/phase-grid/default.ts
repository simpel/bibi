import { cellsIn, type PhaseGridTemplate } from "./phase-grid-template";

/**
 * The grid of the default phases (ADR 0043): every item type has one state, "Active", so the
 * open phases set it and nothing else is needed. Terminal phases release every line.
 */
export const defaultPhaseGrid: PhaseGridTemplate = {
  key: "default",
  name: "Default",
  cells: cellsIn({ phases: ["Lead", "Confirmed"], states: ["Active"] }),
};
