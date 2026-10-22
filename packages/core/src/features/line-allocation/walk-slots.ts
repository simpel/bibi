import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { ItemDemandDto } from "../item-demand/schema";
import { DEMAND_INCLUDE, toDemandDto } from "../item-demand/to-demand-dto";

type Db = { context: Pick<OperationContext, "db"> };

/** How far demands chain: the line's item, its units' demands, and theirs (ADR 0059). */
export const MAX_CHAIN_DEPTH = 3;

/** One slot of a demand: on the line's item (`parentId` null) or on an allocated unit. */
export type Slot = { demand: ItemDemandDto; slot: number; parentId: string | null };

/** A filled slot whose unit's own demands chain on. */
export type Filled = { allocationId: string; unitId: string };

export type WalkSlotsInput = Db & {
  itemId: string;
  visit: (slot: Slot) => Promise<Result<Filled | null>>;
};

type Node = { parentId: string | null; itemId: string; depth: number };

export const demandsOf = async ({ context, itemId }: Db & { itemId: string }) =>
  (
    await context.db.itemDemand.findMany({
      where: { itemId },
      include: DEMAND_INCLUDE,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })
  ).map((row) => toDemandDto({ row }));

type WalkFromInput = Omit<WalkSlotsInput, "itemId"> & { node: Node };

async function walkFrom({ context, node, visit }: WalkFromInput): Promise<Result<true>> {
  if (node.depth >= MAX_CHAIN_DEPTH) return ok({ value: true });
  for (const demand of await demandsOf({ context, itemId: node.itemId })) {
    for (let slot = 0; slot < demand.quantity; slot += 1) {
      const step = await visit({ demand, slot, parentId: node.parentId });
      if (!step.ok) return step;
      if (!step.value) continue;
      const { allocationId, unitId } = step.value;
      const deeper = { parentId: allocationId, itemId: unitId, depth: node.depth + 1 };
      const walked = await walkFrom({ context, node: deeper, visit });
      if (!walked.ok) return walked;
    }
  }
  return ok({ value: true });
}

/**
 * Visits every slot a line needs, depth first: `quantity` slots per active demand of the line's
 * item, and right after a slot a visit reports filled, the slots of that unit's own demands, at
 * most `MAX_CHAIN_DEPTH` deep. Stops at the first error.
 */
export const walkSlots = ({ context, itemId, visit }: WalkSlotsInput): Promise<Result<true>> =>
  walkFrom({ context, visit, node: { parentId: null, itemId, depth: 0 } });

/** The key of a slot, matching an allocation row. */
export const slotKey = ({ demandId, parentId, slot }: SlotKeyInput) =>
  `${demandId} ${parentId ?? "-"} ${slot}`;

export type SlotKeyInput = { demandId: string; parentId: string | null; slot: number };
