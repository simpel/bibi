import { cellsIn, type StatusGridTemplate } from "./status-grid-template";

/**
 * The grid of the default statuses (ADR 0043): every item type has one state, "Active", so the
 * open statuses set it and nothing else is needed. Closing statuses release every line.
 */
export const defaultStatusGrid: StatusGridTemplate = {
  key: "default",
  name: "Default",
  cells: cellsIn({ statuses: ["Lead", "Confirmed"], states: ["Active"] }),
};
