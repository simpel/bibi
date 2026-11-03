import { defineReconciliation, type ReconcileContext } from "./reconcile";

const keyOf = ({ ticketId, workOrderDefinitionId, version }: VersionKey) =>
  `${ticketId} ${workOrderDefinitionId} v${version}`;

type VersionKey = { ticketId: string; workOrderDefinitionId: string; version: number };

/** The newest version of every ticket and definition: the ones that should be current. */
async function rebuildCurrent({ context }: ReconcileContext): Promise<VersionKey[]> {
  const newest = await context.db.workOrder.groupBy({
    by: ["ticketId", "workOrderDefinitionId"],
    _max: { version: true },
  });
  return newest.flatMap(({ ticketId, workOrderDefinitionId, _max }) =>
    _max.version === null ? [] : [{ ticketId, workOrderDefinitionId, version: _max.version }],
  );
}

/** `WorkOrder.current` (ADR 0051) against the version numbers it is derived from. */
export const workOrderCurrentReconciliation = defineReconciliation({
  name: "work-order-current",
  rebuild: rebuildCurrent,
  compare: async ({ context, rebuilt }) => {
    const stored = await context.db.workOrder.findMany({
      where: { current: true },
      select: { ticketId: true, workOrderDefinitionId: true, version: true },
    });
    const have = new Set(stored.map(keyOf));
    const want = new Set(rebuilt.map(keyOf));
    return [
      ...[...want].filter((key) => !have.has(key)).map((key) => `${key} should be current`),
      ...[...have].filter((key) => !want.has(key)).map((key) => `${key} should not be current`),
    ];
  },
});
