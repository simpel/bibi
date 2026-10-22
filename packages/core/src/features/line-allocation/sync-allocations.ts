import type { LineAllocation } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { type Demand, pickFreeUnit, unitMatches } from "./free-unit";
import { lineWindows } from "./line-windows";
import { missingUnit } from "./missing-unit";
import { type Slot, slotKey, walkSlots } from "./walk-slots";

type Context = OperationContext;

const keyOfRow = ({ row }: { row: LineAllocation }) =>
  slotKey({ demandId: row.demandId, parentId: row.parentAllocationId, slot: row.slot });

const record = ({ context, before, after }: { context: Context } & Changed) =>
  context.recordChange({ entityType: "lineAllocation", entityId: after.id, before, after });

type Changed = { before?: LineAllocation; after: LineAllocation };

type PruneInput = { context: Context; itemId: string | null; rows: LineAllocation[] };

/**
 * Keeps the allocations a line still needs: archives slots whose demand, quantity or parent is
 * gone, and unfills a unit that no longer belongs to its demand's target. Returns the kept rows.
 */
async function prune({ context, itemId, rows }: PruneInput): Promise<LineAllocation[]> {
  const byKey = new Map(rows.map((row) => [keyOfRow({ row }), row]));
  const kept = new Map<string, LineAllocation>();
  if (itemId) {
    await walkSlots({
      context,
      itemId,
      visit: async ({ demand, slot, parentId }) => {
        const key = slotKey({ demandId: demand.id, parentId, slot });
        let row = byKey.get(key);
        if (!row) return ok({ value: null });
        if (row.unitId && !(await unitMatches({ context, demand, unitId: row.unitId }))) {
          const after = await context.db.lineAllocation.update({
            where: { id: row.id },
            data: { unitId: null },
          });
          record({ context, before: row, after });
          row = after;
        }
        kept.set(key, row);
        return ok({ value: row.unitId ? { allocationId: row.id, unitId: row.unitId } : null });
      },
    });
  }
  for (const row of rows.filter((candidate) => !kept.has(keyOfRow({ row: candidate })))) {
    const after = await context.db.lineAllocation.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
    });
    record({ context, before: row, after });
  }
  return [...kept.values()];
}

type FillInput = { context: Context; lineId: string; itemId: string; kept: LineAllocation[] };

/**
 * Creates the missing slots and fills each empty one with the prepick (ADR 0059). A mandatory
 * demand with no free unit on a timed line is CONFLICT naming the pool and windows.
 */
async function fill({ context, lineId, itemId, kept }: FillInput): Promise<Result<true>> {
  const byKey = new Map(kept.map((row) => [keyOfRow({ row }), row]));
  const used = new Set([itemId, ...kept.flatMap((row) => (row.unitId ? [row.unitId] : []))]);
  const windows = await lineWindows({ context, lineId });
  const fillSlot = async ({ demand, slot, parentId }: Slot): Promise<Result<Filled>> => {
    const row = byKey.get(slotKey({ demandId: demand.id, parentId, slot })) ?? null;
    const base = row ?? (await createSlot({ context, lineId, demand, slot, parentId }));
    if (base.unitId || !windows) return ok({ value: filledOf({ row: base }) });
    const { unitId, missing } = await pickFreeUnit({
      context,
      demand,
      windows,
      exclude: [...used],
    });
    if (!unitId) {
      return demand.required
        ? missingUnit({ context, demand: missing, windows, lineId })
        : ok({ value: filledOf({ row: base }) });
    }
    used.add(unitId);
    const after = await context.db.lineAllocation.update({
      where: { id: base.id },
      data: { unitId },
    });
    record({ context, before: base, after });
    return ok({ value: filledOf({ row: after }) });
  };
  return walkSlots({ context, itemId, visit: fillSlot });
}

type Filled = { allocationId: string; unitId: string } | null;

const filledOf = ({ row }: { row: LineAllocation }): Filled =>
  row.unitId ? { allocationId: row.id, unitId: row.unitId } : null;

type CreateSlotInput = { context: Context; lineId: string; demand: Demand } & Omit<Slot, "demand">;

async function createSlot({ context, lineId, demand, slot, parentId }: CreateSlotInput) {
  const after = await context.db.lineAllocation.create({
    data: {
      ...{ lineId, demandId: demand.id, slot, parentAllocationId: parentId },
      organizationId: context.organizationId,
    },
  });
  record({ context, after });
  return after;
}

export type SyncAllocationsInput = { context: Context; lineId: string };

/**
 * Brings a line's allocations in step with the demands of its item and of its allocated units
 * (ADR 0059): called whenever a line is added, changed or removed, and by `itemDemand.*` and
 * `lineAllocation.assign`. Holds follow by trigger (`sync_line_occupancy.sql`).
 */
export async function syncAllocations({
  context,
  lineId,
}: SyncAllocationsInput): Promise<Result<true>> {
  const line = await context.db.line.findFirst({ where: { id: lineId }, select: { itemId: true } });
  const rows = await context.db.lineAllocation.findMany({
    where: { lineId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const itemId = line?.itemId ?? null;
  const kept = await prune({ context, itemId, rows });
  if (!itemId) return ok({ value: true });
  return fill({ context, lineId, itemId, kept });
}
