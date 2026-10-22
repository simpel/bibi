import { effectiveBuffers } from "../../shared/buffers";
import { type HoldRow, isLineRowType, type LineRowType, rowsOf } from "./line-holds-rows";
import { defineReconciliation, type ReconcileContext } from "./reconcile";

const keyOf = ({ lineId, itemId, type }: Pick<HoldRow, "lineId" | "itemId" | "type">) =>
  `${lineId} ${itemId} ${type}`;

const describeRow = ({ type, itemId, allocationId, holdKind, startsAt, endsAt }: HoldRow) =>
  `${type} ${itemId}${allocationId ? ` (allocation ${allocationId})` : ""} ${holdKind ?? "-"} ` +
  `${startsAt.toISOString()}-${endsAt.toISOString()}`;

const sameRow = ({ a, b }: { a: HoldRow; b: HoldRow }) => describeRow(a) === describeRow(b);

const minutes = { setupMinutes: true, teardownMinutes: true } as const;

/** The active filled allocations whose units can be held (ADR 0059). */
const HELD_ALLOCATIONS = {
  where: {
    status: "ACTIVE",
    unitId: { not: null },
    demand: { status: "ACTIVE" },
    unit: { status: "ACTIVE", entityType: { capabilities: { has: "BOOKABLE" } } },
  },
  select: { id: true, unitId: true, demand: { select: { windows: true } } },
} as const;

/**
 * What the lines say should be held (ADR 0044, 0053, 0059): an active, timed line of an active
 * ticket outside a terminal phase, on a `BOOKABLE` item, in a state that holds and is not
 * released, has a `HOLD` of the state's kind and, of the same kind, a `SETUP` right before and a
 * `TEARDOWN` right after when their effective minutes are above zero, and holds each allocated
 * unit for its demand's windows. Only lines that have not ended: the past calendar is frozen
 * (ADR 0053, rule 8).
 */
async function rebuildLineHolds({ context }: ReconcileContext): Promise<HoldRow[]> {
  const lines = await context.db.line.findMany({
    where: {
      endsAt: { gt: new Date() },
      startsAt: { not: null },
      ticket: { status: "ACTIVE", phase: { terminal: false } },
      item: { entityType: { capabilities: { has: "BOOKABLE" } } },
      state: { released: false, hold: { not: "NONE" } },
    },
    select: {
      ...{ id: true, itemId: true, startsAt: true, endsAt: true, ...minutes },
      state: { select: { hold: true } },
      setup: { select: { changeoverMinutes: true } },
      item: { select: { ...minutes, entityType: { select: minutes } } },
      allocations: HELD_ALLOCATIONS,
    },
  });
  return lines.flatMap(({ id: lineId, itemId, startsAt, endsAt, state, setup, item, ...rest }) => {
    const { allocations, ...line } = rest;
    if (!itemId || !state || !startsAt || !endsAt) return [];
    const buffers = effectiveBuffers({
      line,
      item,
      type: item?.entityType ?? null,
      changeoverMinutes: setup?.changeoverMinutes ?? null,
    });
    return rowsOf({
      line: { lineId, itemId, holdKind: state.hold, startsAt, endsAt },
      setup: buffers.effectiveSetupMinutes,
      teardown: buffers.effectiveTeardownMinutes,
      units: allocations.flatMap(({ id, unitId, demand }) =>
        unitId ? [{ allocationId: id, unitId, windows: demand.windows }] : [],
      ),
    });
  });
}

/** The stored line holds of lines that have not ended. */
async function storedLineHolds({ context }: ReconcileContext): Promise<HoldRow[]> {
  const rows = await context.db.occupancy.findMany({
    where: { lineId: { not: null }, line: { endsAt: { gt: new Date() } } },
    select: {
      lineId: true,
      type: true,
      itemId: true,
      allocationId: true,
      holdKind: true,
      startsAt: true,
      endsAt: true,
    },
  });
  return rows.flatMap(({ lineId, type, ...row }) =>
    lineId && isLineRowType({ type }) ? [{ ...row, lineId, type: type as LineRowType }] : [],
  );
}

/**
 * Line holds, buffers and allocation holds (`Occupancy` with a `lineId`) against the lines and
 * allocations they are derived from.
 */
export const lineHoldsReconciliation = defineReconciliation({
  name: "line-holds",
  rebuild: rebuildLineHolds,
  compare: async ({ context, rebuilt }) => {
    const byKey = new Map((await storedLineHolds({ context })).map((row) => [keyOf(row), row]));
    const differing: string[] = [];
    for (const want of rebuilt) {
      const have = byKey.get(keyOf(want));
      byKey.delete(keyOf(want));
      if (!have) differing.push(`line ${want.lineId} lacks ${describeRow(want)}`);
      else if (!sameRow({ a: have, b: want })) {
        differing.push(
          `line ${want.lineId} has ${describeRow(have)}, expected ${describeRow(want)}`,
        );
      }
    }
    for (const row of byKey.values())
      differing.push(`line ${row.lineId} should not have ${describeRow(row)}`);
    return differing;
  },
});
