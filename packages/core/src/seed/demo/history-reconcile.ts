import { defineReconciliation, type ReconcileContext } from "./reconcile";

const ALL = { status: { in: ["ACTIVE" as const, "ARCHIVED" as const] } };

/** One record's current value as its newest history row says (null: no row, or no state). */
type Current = { id: string; value: string | null };

type Change = { id: string; to: string | null };

/** The newest `to` per record, from history rows in insertion order (`seq`). */
const newestOf = ({ changes }: { changes: readonly Change[] }): Map<string, string | null> =>
  new Map(changes.map((change) => [change.id, change.to]));

type CompareInput = { stored: readonly Current[]; rebuilt: readonly Current[]; label: string };

/** One message per record whose stored value is not the newest history row's. */
function compareCurrent({ stored, rebuilt, label }: CompareInput): string[] {
  const want = new Map(rebuilt.map((row) => [row.id, row.value]));
  return stored
    .filter((row) => (want.get(row.id) ?? null) !== row.value)
    .map((row) => `${label} ${row.id} is ${row.value}, history says ${want.get(row.id) ?? null}`);
}

/** Every ticket's phase from its phase history (ADR 0054). */
async function rebuildPhases({ context: { db } }: ReconcileContext): Promise<Current[]> {
  const changes = await db.ticketPhaseChange.findMany({
    select: { ticketId: true, toPhaseId: true },
    orderBy: { seq: "asc" },
  });
  const newest = newestOf({
    changes: changes.map((row) => ({ id: row.ticketId, to: row.toPhaseId })),
  });
  return [...newest].map(([id, value]) => ({ id, value }));
}

/** `Ticket.phaseId` against the newest `TicketPhaseChange` of each ticket (ADR 0054). */
export const ticketPhaseReconciliation = defineReconciliation({
  name: "ticket phases",
  rebuild: rebuildPhases,
  compare: async ({ context, rebuilt }) => {
    const rows = await context.db.ticket.findMany({
      where: ALL,
      select: { id: true, phaseId: true },
    });
    const stored = rows.map((row) => ({ id: row.id, value: row.phaseId }));
    return compareCurrent({ stored, rebuilt, label: "ticket" });
  },
});

/** Every line's state from its state history (ADR 0054); a line without rows has none. */
async function rebuildStates({ context: { db } }: ReconcileContext): Promise<Current[]> {
  const changes = await db.lineStateChange.findMany({
    select: { lineId: true, toStateId: true },
    orderBy: { seq: "asc" },
  });
  const newest = newestOf({
    changes: changes.map((row) => ({ id: row.lineId, to: row.toStateId })),
  });
  return [...newest].map(([id, value]) => ({ id, value }));
}

/** `Line.stateId` against the newest `LineStateChange` of each line (ADR 0054). */
export const lineStateReconciliation = defineReconciliation({
  name: "line states",
  rebuild: rebuildStates,
  compare: async ({ context, rebuilt }) => {
    const rows = await context.db.line.findMany({
      where: ALL,
      select: { id: true, stateId: true },
    });
    const stored = rows.map((row) => ({ id: row.id, value: row.stateId }));
    return compareCurrent({ stored, rebuilt, label: "line" });
  },
});
