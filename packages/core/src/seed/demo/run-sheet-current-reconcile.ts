import { defineReconciliation, type ReconcileContext } from "./reconcile";

const keyOf = ({ orderId, runSheetDefinitionId, version }: VersionKey) =>
  `${orderId} ${runSheetDefinitionId} v${version}`;

type VersionKey = { orderId: string; runSheetDefinitionId: string; version: number };

/** The newest version of every order and definition: the ones that should be current. */
async function rebuildCurrent({ context }: ReconcileContext): Promise<VersionKey[]> {
  const newest = await context.db.runSheet.groupBy({
    by: ["orderId", "runSheetDefinitionId"],
    _max: { version: true },
  });
  return newest.flatMap(({ orderId, runSheetDefinitionId, _max }) =>
    _max.version === null ? [] : [{ orderId, runSheetDefinitionId, version: _max.version }],
  );
}

/** `RunSheet.current` (ADR 0051) against the version numbers it is derived from. */
export const runSheetCurrentReconciliation = defineReconciliation({
  name: "run-sheet-current",
  rebuild: rebuildCurrent,
  compare: async ({ context, rebuilt }) => {
    const stored = await context.db.runSheet.findMany({
      where: { current: true },
      select: { orderId: true, runSheetDefinitionId: true, version: true },
    });
    const have = new Set(stored.map(keyOf));
    const want = new Set(rebuilt.map(keyOf));
    return [
      ...[...want].filter((key) => !have.has(key)).map((key) => `${key} should be current`),
      ...[...have].filter((key) => !want.has(key)).map((key) => `${key} should not be current`),
    ];
  },
});
