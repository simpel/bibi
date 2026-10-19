import { defineReconciliation, type ReconcileContext } from "./reconcile";

type HoldRow = {
  lineId: string;
  type: "HOLD" | "SETUP";
  itemId: string;
  holdKind: string | null;
  startsAt: Date;
  endsAt: Date;
};

const keyOf = ({ lineId, type }: Pick<HoldRow, "lineId" | "type">) => `${lineId} ${type}`;

const describeRow = ({ type, itemId, holdKind, startsAt, endsAt }: HoldRow) =>
  `${type} ${itemId} ${holdKind ?? "-"} ${startsAt.toISOString()}-${endsAt.toISOString()}`;

const sameRow = ({ a, b }: { a: HoldRow; b: HoldRow }) => describeRow(a) === describeRow(b);

/**
 * What the lines say should be held (ADR 0044, 0053): an active, timed line of an active ticket
 * outside a terminal phase, on a `BOOKABLE` item, in a state that holds and is not released, has a
 * `HOLD` of the state's kind and, when hard with a changeover time, a `SETUP` right before. Only
 * lines that have not ended: the past calendar is frozen (ADR 0053, rule 8).
 */
async function rebuildLineHolds({ context }: ReconcileContext): Promise<HoldRow[]> {
  const lines = await context.db.line.findMany({
    where: {
      endsAt: { gt: new Date() },
      startsAt: { not: null },
      ticket: { status: "ACTIVE", phase: { terminal: false } },
      item: { entityType: { behaviours: { has: "BOOKABLE" } } },
      state: { released: false, hold: { not: "NONE" } },
    },
    select: {
      id: true,
      itemId: true,
      startsAt: true,
      endsAt: true,
      state: { select: { hold: true } },
      setup: { select: { changeoverMinutes: true } },
    },
  });
  return lines.flatMap(({ id: lineId, itemId, startsAt, endsAt, state, setup }) => {
    if (!itemId || !state || !startsAt || !endsAt) return [];
    const hold: HoldRow = { lineId, type: "HOLD", itemId, holdKind: state.hold, startsAt, endsAt };
    const minutes = state.hold === "HARD" ? (setup?.changeoverMinutes ?? 0) : 0;
    if (minutes <= 0) return [hold];
    const before = new Date(startsAt.getTime() - minutes * 60_000);
    return [hold, { ...hold, type: "SETUP", holdKind: null, startsAt: before, endsAt: startsAt }];
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
    lineId && (type === "HOLD" || type === "SETUP") ? [{ ...row, lineId, type }] : [],
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
