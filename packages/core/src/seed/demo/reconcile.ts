import type { ExecuteContext } from "../../operations/context";

export type ReconcileContext = { context: ExecuteContext };

export type CompareInput<Row> = ReconcileContext & { rebuilt: Row[] };

/**
 * A reconciliation check for one projection (ADR 0051, rule 7). `rebuild` derives what the
 * projection should hold from owned data only. `compare` reads the stored projection and returns one
 * message per differing row (empty when they match).
 */
export type Reconciliation<Row = unknown> = {
  name: string;
  rebuild: (input: ReconcileContext) => Promise<Row[]>;
  compare: (input: CompareInput<Row>) => Promise<string[]>;
};

/** Keeps the type of one registration while a list holds many. */
export const defineReconciliation = <Row>({
  name,
  rebuild,
  compare,
}: Reconciliation<Row>): Reconciliation => ({ name, rebuild, compare }) as Reconciliation;

export const MAX_DIFFERING_ROWS = 5;

export type RunReconciliationsInput = ReconcileContext & { checks: Reconciliation[] };

/** Runs every check. A failing check reports its first differing rows, prefixed with its name. */
export async function runReconciliations({
  context,
  checks,
}: RunReconciliationsInput): Promise<string[]> {
  const failures: string[] = [];
  for (const check of checks) {
    const rebuilt = await check.rebuild({ context });
    const differing = await check.compare({ context, rebuilt });
    for (const row of differing.slice(0, MAX_DIFFERING_ROWS)) {
      failures.push(`reconcile ${check.name}: ${row}`);
    }
    if (differing.length > MAX_DIFFERING_ROWS) {
      failures.push(
        `reconcile ${check.name}: ${differing.length - MAX_DIFFERING_ROWS} more differing rows`,
      );
    }
  }
  return failures;
}
