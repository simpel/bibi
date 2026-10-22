import type { Prisma } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { poolUnitsWhere, takenIn } from "../item/pool-free-units";
import type { ItemDemandDto } from "../item-demand/schema";
import type { LineWindow } from "./line-windows";
import { demandsOf } from "./walk-slots";

type Db = { context: Pick<OperationContext, "db"> };

/** The windows of the line that a demand holds its units for. */
export const demandWindows = ({ demand, windows }: { demand: Demand; windows: LineWindow[] }) =>
  windows.filter((window) => demand.windows.includes(window.window));

export type Demand = Pick<
  ItemDemandDto,
  "id" | "targetItemId" | "entityTypeId" | "tagValueIds" | "windows" | "required"
>;

const targetOf = ({ demand }: { demand: Demand }) => ({
  itemId: demand.targetItemId,
  entityTypeId: demand.entityTypeId,
  tagValueIds: demand.tagValueIds,
});

export type UnitsWhereInput = Db & {
  demand: Demand;
  windows: LineWindow[];
  /** Units already on the line: a unit fills at most one slot per line. */
  exclude: readonly string[];
};

/**
 * The units of a demand's target that are free in every window the demand holds them for: no
 * hard hold, buffer or manual block overlaps (soft holds do not take a unit, as in
 * `item.freeUnits`).
 */
export async function freeUnitsWhere({
  context,
  demand,
  windows,
  exclude,
}: UnitsWhereInput): Promise<Result<Prisma.ItemWhereInput>> {
  const base = await poolUnitsWhere({ context, input: targetOf({ demand }) });
  if (!base.ok) return base;
  const held = demandWindows({ demand, windows });
  const free: Prisma.ItemWhereInput = held.length
    ? { occupancies: { none: { OR: held.map((window) => takenIn(window)) } } }
    : {};
  return ok({ value: { AND: [base.value, free, { id: { notIn: [...exclude] } }] } });
}

/** How many candidates the prepick tries before giving up (pool order). */
const MAX_CANDIDATES = 50;

export type ShortfallInput = Db & { unitId: string; windows: LineWindow[]; exclude: string[] };

/**
 * The chained pool check (ADR 0059): the first mandatory demand of a unit that its pool cannot
 * meet in the line's windows (an AV unit needs a free technician), or null. One level deep.
 */
export async function chainShortfall({ context, unitId, windows, exclude }: ShortfallInput) {
  for (const demand of await demandsOf({ context, itemId: unitId })) {
    if (!demand.required) continue;
    const where = await freeUnitsWhere({ context, demand, windows, exclude: [...exclude, unitId] });
    const free = where.ok ? await context.db.item.count({ where: where.value }) : 0;
    if (free < demand.quantity) return demand;
  }
  return null;
}

/** The prepick, or why there is none: the demand itself, or a chained demand of its units. */
export type Prepick = { unitId: string | null; missing: Demand };

/**
 * The prepick: the first free unit in pool order (name, then id) whose own mandatory demands can
 * be met, else null with the demand that is short.
 */
export async function pickFreeUnit({
  context,
  demand,
  windows,
  exclude,
}: UnitsWhereInput): Promise<Prepick> {
  const where = await freeUnitsWhere({ context, demand, windows, exclude });
  if (!where.ok) return { unitId: null, missing: demand };
  const candidates = await context.db.item.findMany({
    where: where.value,
    select: { id: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: MAX_CANDIDATES,
  });
  let missing: Demand = demand;
  for (const { id } of candidates) {
    const short = await chainShortfall({ context, unitId: id, windows, exclude: [...exclude] });
    if (!short) return { unitId: id, missing };
    missing = short;
  }
  return { unitId: null, missing };
}

export type UnitMatchesInput = Db & { demand: Demand; unitId: string };

/** The unit is (still) one of the demand's target, whatever its availability. */
export async function unitMatches({ context, demand, unitId }: UnitMatchesInput) {
  const base = await poolUnitsWhere({ context, input: targetOf({ demand }) });
  if (!base.ok) return false;
  const found = await context.db.item.count({ where: { AND: [base.value, { id: unitId }] } });
  return found > 0;
}
