import { LINE_SOURCE } from "../../features/line/schema";
import { defineReconciliation, type ReconcileContext, runReconciliations } from "./reconcile";
import { recordReconciliation } from "./record-reconciliation";

type HoldRow = { lineId: string; itemId: string; holdKind: string; startsAt: Date; endsAt: Date };

const describeHold = ({ itemId, holdKind, startsAt, endsAt }: HoldRow) =>
  `${itemId} ${holdKind} ${startsAt.toISOString()}-${endsAt.toISOString()}`;

/** What the lines say should be held (ADR 0044): the state's hold on a bookable item, until released. */
async function rebuildLineHolds({ context }: ReconcileContext): Promise<HoldRow[]> {
  const lines = await context.db.line.findMany({
    where: {
      status: "ACTIVE",
      ticket: { status: "ACTIVE" },
      item: { entityType: { behaviours: { has: "BOOKABLE" } } },
      state: { released: false, hold: { not: "NONE" } },
    },
    select: {
      id: true,
      itemId: true,
      startsAt: true,
      endsAt: true,
      state: { select: { hold: true } },
    },
  });
  return lines.flatMap((line) =>
    line.itemId && line.state
      ? [{ ...line, lineId: line.id, itemId: line.itemId, holdKind: line.state.hold }]
      : [],
  );
}

/** Line holds (`Occupancy` of type `HOLD`) against the lines they are derived from. */
export const lineHoldsReconciliation = defineReconciliation({
  name: "line-holds",
  rebuild: rebuildLineHolds,
  compare: async ({ context, rebuilt }) => {
    const stored = await context.db.occupancy.findMany({
      where: { status: "ACTIVE", type: "HOLD", sourceType: LINE_SOURCE },
      select: { sourceId: true, itemId: true, holdKind: true, startsAt: true, endsAt: true },
    });
    const byLine = new Map(stored.map((row) => [row.sourceId, row]));
    const differing: string[] = [];
    for (const want of rebuilt) {
      const have = byLine.get(want.lineId);
      byLine.delete(want.lineId);
      if (!have) differing.push(`line ${want.lineId} has no hold, expected ${describeHold(want)}`);
      else if (
        have.itemId !== want.itemId ||
        have.holdKind !== want.holdKind ||
        have.startsAt.getTime() !== want.startsAt.getTime() ||
        have.endsAt.getTime() !== want.endsAt.getTime()
      ) {
        differing.push(`line ${want.lineId} hold differs, expected ${describeHold(want)}`);
      }
    }
    for (const sourceId of byLine.keys()) differing.push(`hold of line ${sourceId} has no line`);
    return differing;
  },
});

export const RECONCILIATIONS = [lineHoldsReconciliation, recordReconciliation];

/** Runs every registered projection check (ADR 0051); also called from Vitest. */
export const reconcileProjections = ({ context }: ReconcileContext) =>
  runReconciliations({ context, checks: RECONCILIATIONS });
