import type { OperationContext } from "../../operations/types";
import { ELEMENT_INCLUDE, toElementDto } from "./element-rows";

type Db = { context: Pick<OperationContext, "db"> };

export type CapacitySource = "LAYOUT" | "MANUAL" | "NONE";

export type EffectiveCapacityInput = { capacity: number | null; seatCount: number | null };

/**
 * The capacity of an item in a setup (ADR 0099, 0102): a typed capacity wins, else the largest
 * layout's seats, else none. The only place this rule lives.
 */
export function effectiveCapacity({ capacity, seatCount }: EffectiveCapacityInput): {
  effectiveCapacity: number | null;
  capacitySource: CapacitySource;
} {
  if (capacity !== null) return { effectiveCapacity: capacity, capacitySource: "MANUAL" };
  if (seatCount !== null) return { effectiveCapacity: seatCount, capacitySource: "LAYOUT" };
  return { effectiveCapacity: null, capacitySource: "NONE" };
}

export const layoutKey = ({ itemId, setupId }: { itemId: string; setupId: string }) =>
  `${itemId} ${setupId}`;

export type LayoutSeats = { seatCount: number };

export type LoadLayoutSeatsInput = Db & { itemIds: readonly string[] };

/**
 * The most seats of each item's layouts per setup, by `layoutKey` (ADR 0102: a setup holds as
 * many as its largest layout). A layout with no pieces counts for nothing. One query.
 */
export async function loadLayoutSeats({
  context,
  itemIds,
}: LoadLayoutSeatsInput): Promise<Map<string, LayoutSeats>> {
  if (itemIds.length === 0) return new Map();
  const layouts = await context.db.setupLayout.findMany({
    where: { itemId: { in: [...itemIds] } },
    select: { itemId: true, setupId: true, elements: { include: ELEMENT_INCLUDE } },
  });
  const seats = new Map<string, LayoutSeats>();
  for (const layout of layouts) {
    if (layout.elements.length === 0) continue;
    const seatCount = layout.elements.reduce(
      (sum, row) => sum + toElementDto({ row }).seatCount,
      0,
    );
    const key = layoutKey(layout);
    if (seatCount >= (seats.get(key)?.seatCount ?? -1)) seats.set(key, { seatCount });
  }
  return seats;
}
