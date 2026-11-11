import type { OperationContext } from "../../operations/types";
import { ELEMENT_INCLUDE, toElementDto } from "./element-rows";

type Db = { context: Pick<OperationContext, "db"> };

export type CapacitySource = "LAYOUT" | "MANUAL" | "NONE";

export type EffectiveCapacityInput = { capacity: number | null; seatCount: number | null };

/**
 * The capacity of a layout (ADR 0099, 0103): a typed capacity wins, else its seats (a layout with
 * no pieces has none), else none. The only place this rule lives.
 */
export function effectiveCapacity({ capacity, seatCount }: EffectiveCapacityInput): {
  effectiveCapacity: number | null;
  capacitySource: CapacitySource;
} {
  if (capacity !== null) return { effectiveCapacity: capacity, capacitySource: "MANUAL" };
  if (seatCount !== null) return { effectiveCapacity: seatCount, capacitySource: "LAYOUT" };
  return { effectiveCapacity: null, capacitySource: "NONE" };
}

/** What lines, plans and items need of a layout: its room, buffers and capacity. */
export type LayoutFacts = {
  id: string;
  itemId: string;
  name: string;
  setupMinutes: number | null;
  teardownMinutes: number | null;
  /** This layout's seats; null when it has no pieces. */
  seatCount: number | null;
  capacity: number | null;
  effectiveCapacity: number | null;
};

export type LoadLayoutFactsInput = Db & {
  /** The layouts to read, by id. */
  ids?: readonly string[];
  /** Or every active layout of these items. */
  itemIds?: readonly string[];
  /** Include archived layouts (a line may still book one). */
  archived?: boolean;
};

/** Layouts by id with their effective capacity, in one query (ADR 0103). */
export async function loadLayoutFacts({
  context,
  ids,
  itemIds,
  archived = false,
}: LoadLayoutFactsInput): Promise<Map<string, LayoutFacts>> {
  if (!ids?.length && !itemIds?.length) return new Map();
  const rows = await context.db.setupLayout.findMany({
    where: {
      ...(ids?.length ? { id: { in: [...ids] } } : { itemId: { in: [...(itemIds ?? [])] } }),
      ...(archived ? { status: { in: ["ACTIVE", "ARCHIVED"] } } : {}),
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    include: { elements: { include: ELEMENT_INCLUDE } },
  });
  return new Map(
    rows.map((row) => {
      const seatCount = row.elements.length
        ? row.elements.reduce((sum, element) => sum + toElementDto({ row: element }).seatCount, 0)
        : null;
      const { id, itemId, setupMinutes, teardownMinutes, capacity } = row;
      const facts: LayoutFacts = {
        ...{ id, itemId, name: row.name ?? "", setupMinutes, teardownMinutes, seatCount, capacity },
        effectiveCapacity: effectiveCapacity({ capacity, seatCount }).effectiveCapacity,
      };
      return [id, facts];
    }),
  );
}
