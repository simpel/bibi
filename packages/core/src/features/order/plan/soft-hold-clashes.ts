import { blocks, type OccupancyRow } from "./occupancy-rows";
import { overlaps } from "./planned-line";

/** A line as the clash check needs it: its id and its order's reference. */
export type ClashLine = { id: string; order: { reference: number } };

export type SoftHoldClashesInput = { lines: readonly ClashLine[]; rows: readonly OccupancyRow[] };

/**
 * Each line's own hold row, and the other orders' blocking rows (a hard hold, a buffer or a
 * manual block) overlapping its soft hold on the same item: one pass over loaded occupancy.
 */
export function softHoldClashes({ lines, rows }: SoftHoldClashesInput) {
  const ids = new Set(lines.map((line) => line.id));
  const own = new Map(
    rows.flatMap((row) =>
      row.lineId && ids.has(row.lineId) && row.type === "HOLD" && row.holdKind
        ? [[row.lineId, row] as const]
        : [],
    ),
  );
  const clashes = new Map<string, OccupancyRow[]>();
  for (const [lineId, mine] of own) {
    if (mine.holdKind !== "SOFT") continue;
    const reference = lines.find((line) => line.id === lineId)?.order.reference;
    const met = rows.filter(
      (row) =>
        row.itemId === mine.itemId &&
        blocks({ row }) &&
        row.orderReference !== reference &&
        overlaps({ a: row, b: mine }),
    );
    if (met.length > 0) clashes.set(lineId, met);
  }
  return { own, clashes };
}
