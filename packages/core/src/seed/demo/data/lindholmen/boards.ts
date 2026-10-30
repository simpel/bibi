import type { DemoBoard } from "../../types";

/**
 * Lindholmen's boards (ADR 0067) besides the default "Pipeline" one: Sales groups the statuses
 * into four phases from lead to closed, Ops shows only the statuses the kitchen and venue staff
 * work from (the rest are off the board).
 */
export const lindholmenBoards: readonly DemoBoard[] = [
  {
    name: "Sales",
    phases: [
      { name: "Lead", statuses: ["New", "Site visit"] },
      { name: "Quote sent", statuses: ["Quote sent"] },
      { name: "Won", statuses: ["Confirmed", "Final count locked"] },
      { name: "Closed", statuses: ["Completed", "Lost", "Cancelled"] },
    ],
  },
  {
    name: "Ops",
    phases: [
      { name: "Confirmed", statuses: ["Confirmed"] },
      { name: "Final count locked", statuses: ["Final count locked"] },
      { name: "Completed", statuses: ["Completed"] },
    ],
  },
];
