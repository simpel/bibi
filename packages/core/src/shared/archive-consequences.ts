import type { Consequence } from "../change-preview/schema";

export type ArchiveConsequencesInput = {
  /** Rows that move to the target: tickets for a status, lines for a state. */
  moving: number;
  /** Status grid cells that are cleared. */
  cells: number;
  /** Name of the status or state they move to, when one is given. */
  target: string | null;
  /** `tickets` or `lines`, for the message. */
  rows: "tickets" | "lines";
};

/** The approval card's consequences of archiving a status or a state (ADR 0049). */
export function archiveConsequences({
  moving,
  cells,
  target,
  rows,
}: ArchiveConsequencesInput): Consequence[] {
  return [
    ...(moving > 0
      ? [
          {
            key: rows === "tickets" ? "ticketsMove" : "linesMove",
            values: { count: moving, target: target ?? "" },
            severity: "warning" as const,
          },
        ]
      : []),
    ...(cells > 0
      ? [{ key: "gridCellsCleared", values: { count: cells }, severity: "warning" as const }]
      : []),
  ];
}
