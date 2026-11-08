import type { OperationContext } from "../../operations/types";
import { ELEMENT_INCLUDE, toElementDto } from "./element-rows";

type Db = { context: Pick<OperationContext, "db"> };

export type CapacitySource = "LAYOUT" | "MANUAL" | "NONE";

export type EffectiveCapacityInput = { capacity: number | null; seatCount: number | null };

/**
 * The capacity of an item in a setup (ADR 0099): a typed capacity wins, else the layout's seats,
 * else none. The only place this rule lives.
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

export type LayoutSeats = { layoutId: string; seatCount: number };

export type LoadLayoutSeatsInput = Db & { itemIds: readonly string[] };

/** The drawn layouts of the items with their seat counts, by `layoutKey`. One query. */
export async function loadLayoutSeats({
  context,
  itemIds,
}: LoadLayoutSeatsInput): Promise<Map<string, LayoutSeats>> {
  if (itemIds.length === 0) return new Map();
  const layouts = await context.db.setupLayout.findMany({
    where: { itemId: { in: [...itemIds] } },
    select: { id: true, itemId: true, setupId: true, elements: { include: ELEMENT_INCLUDE } },
  });
  return new Map(
    layouts.map((layout) => [
      layoutKey(layout),
      {
        layoutId: layout.id,
        seatCount: layout.elements.reduce((sum, row) => sum + toElementDto({ row }).seatCount, 0),
      },
    ]),
  );
}
