import { effectiveBuffers } from "../../shared/buffers";
import { defineReconciliation, type ReconcileContext } from "./reconcile";

const LINE_ROW_TYPES = ["HOLD", "SETUP", "TEARDOWN"] as const;
type LineRowType = (typeof LINE_ROW_TYPES)[number];

const isLineRowType = ({ type }: { type: string }): boolean =>
  (LINE_ROW_TYPES as readonly string[]).includes(type);

type HoldRow = {
  lineId: string;
  type: LineRowType;
  itemId: string;
  holdKind: string | null;
  startsAt: Date;
  endsAt: Date;
};

const keyOf = ({ lineId, itemId, type }: Pick<HoldRow, "lineId" | "itemId" | "type">) =>
  `${lineId} ${itemId} ${type}`;

const describeRow = ({ type, itemId, holdKind, startsAt, endsAt }: HoldRow) =>
  `${type} ${itemId} ${holdKind ?? "-"} ${startsAt.toISOString()}-${endsAt.toISOString()}`;

const sameRow = ({ a, b }: { a: HoldRow; b: HoldRow }) => describeRow(a) === describeRow(b);

const minutes = { setupMinutes: true, teardownMinutes: true } as const;

type Timed = { lineId: string; itemId: string; holdKind: string; startsAt: Date; endsAt: Date };

/** A held line's rows: the hold, and each buffer whose minutes are above zero. */
function rowsOf({ hold, setup, teardown }: { hold: Timed; setup: number; teardown: number }) {
  const rows: HoldRow[] = [{ ...hold, type: "HOLD" }];
  const { startsAt, endsAt } = hold;
  if (setup > 0) {
    rows.push({
      ...hold,
      type: "SETUP",
      startsAt: shift({ at: startsAt, minutes: -setup }),
      endsAt: startsAt,
    });
  }
  if (teardown > 0) {
    rows.push({
      ...hold,
      type: "TEARDOWN",
      startsAt: endsAt,
      endsAt: shift({ at: endsAt, minutes: teardown }),
    });
  }
  return rows;
}

const shift = ({ at, minutes }: { at: Date; minutes: number }) =>
  new Date(at.getTime() + minutes * 60_000);

/**
 * What the lines say should be held (ADR 0044, 0053, 0059): an active, timed line of an active
 * ticket outside a terminal phase, on a `BOOKABLE` item, in a state that holds and is not
 * released, has a `HOLD` of the state's kind and, of the same kind, a `SETUP` right before and a
 * `TEARDOWN` right after when their effective minutes are above zero. Only lines that have not
 * ended: the past calendar is frozen (ADR 0053, rule 8).
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
    },
  });
  return lines.flatMap(({ id: lineId, itemId, startsAt, endsAt, state, setup, item, ...line }) => {
    if (!itemId || !state || !startsAt || !endsAt) return [];
    const buffers = effectiveBuffers({
      line,
      item,
      type: item?.entityType ?? null,
      changeoverMinutes: setup?.changeoverMinutes ?? null,
    });
    return rowsOf({
      hold: { lineId, itemId, holdKind: state.hold, startsAt, endsAt },
      setup: buffers.effectiveSetupMinutes,
      teardown: buffers.effectiveTeardownMinutes,
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
      holdKind: true,
      startsAt: true,
      endsAt: true,
    },
  });
  return rows.flatMap(({ lineId, type, ...row }) =>
    lineId && isLineRowType({ type }) ? [{ ...row, lineId, type: type as LineRowType }] : [],
  );
}

/** Line holds and buffers (`Occupancy` with a `lineId`) against the lines they are derived from. */
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
