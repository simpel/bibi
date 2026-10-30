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
      { name: "Lead", color: "#f59e0b", statuses: ["New", "Site visit"] },
      { name: "Quote sent", color: "#7c3aed", statuses: ["Quote sent"] },
      { name: "Won", color: "#16a34a", statuses: ["Confirmed", "Final count locked"] },
      { name: "Closed", color: "#6b7280", statuses: ["Completed", "Lost", "Cancelled"] },
    ],
  },
  {
    name: "Ops",
    phases: [
      { name: "Confirmed", color: "#16a34a", statuses: ["Confirmed"] },
      { name: "Final count locked", color: "#0d9488", statuses: ["Final count locked"] },
      { name: "Completed", color: "#2563eb", statuses: ["Completed"] },
    ],
  },
];
