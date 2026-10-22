import { freeUnits } from "../../features/item/pool-operations";
import { getItemDemand } from "../../features/item-demand/read-operations";
import type { LineDto } from "../../features/line/schema";
import { lineWindows } from "../../features/line-allocation/line-windows";
import { listLineAllocations } from "../../features/line-allocation/read-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { allLines } from "./all-lines";
import type { DemoOrg } from "./types";

export type CheckDemoAllocationsInput = { context: ExecuteContext; org: DemoOrg };

type LineCheck = { context: ExecuteContext; org: DemoOrg; line: LineDto };

/**
 * One timed line's filled allocations: each unit is no longer free in the windows its demand
 * holds it for, so another line in those windows gets another unit (ADR 0059). Returns the
 * number of filled allocations and the failures.
 */
async function checkLine({ context, org, line }: LineCheck) {
  const failures: string[] = [];
  const input = { lineId: line.id, limit: 100 };
  const listed = await execute({ operation: listLineAllocations, input, context });
  if (!listed.ok) return { filled: 0, failures: [`${org.slug}: ${line.name} allocations`] };
  const windows = (await lineWindows({ context, lineId: line.id })) ?? [];
  let filled = 0;
  for (const allocation of listed.value.items) {
    const demand = await execute({
      operation: getItemDemand,
      input: { id: allocation.demandId },
      context,
    });
    if (!demand.ok) continue;
    if (!allocation.unitId) {
      if (demand.value.required && windows.length) {
        failures.push(`${org.slug}: ${line.name} has an unfilled mandatory demand`);
      }
      continue;
    }
    filled += 1;
    for (const window of windows.filter((w) => demand.value.windows.includes(w.window))) {
      const pool = { entityTypeId: demand.value.entityTypeId ?? undefined, tagValueIds: [] };
      const free = await execute({
        operation: freeUnits,
        input: { ...pool, startsAt: window.startsAt, endsAt: window.endsAt, limit: 100 },
        context,
      });
      if (free.ok && free.value.items.some((unit) => unit.id === allocation.unitId)) {
        failures.push(`${org.slug}: ${line.name}'s unit is still free in ${window.window}`);
      }
    }
  }
  return { filled, failures };
}

/**
 * ADR 0059 (`docs/demo-seed.md`, allocations): every hard-held line whose item has demands has
 * each mandatory slot filled, and each allocated unit is held for its demand's windows. An
 * organization whose items have demands shows at least one such allocation. That the holds match
 * exactly is the `line-holds` reconciliation's job.
 */
export async function checkDemoAllocations({ context, org }: CheckDemoAllocationsInput) {
  const wants = org.config.items.some((item) => item.demands?.length);
  const lines = await allLines({ context });
  if (!lines) return [`${org.slug}: could not list lines`];
  const states = await context.db.itemState.findMany({ where: { hold: "HARD" } });
  const hard = new Set(states.map((state) => state.id));
  const failures: string[] = [];
  let filled = 0;
  for (const line of lines.filter(
    (candidate) => candidate.stateId && hard.has(candidate.stateId),
  )) {
    const result = await checkLine({ context, org, line });
    filled += result.filled;
    failures.push(...result.failures);
  }
  if (wants && filled === 0) failures.push(`${org.slug}: no hard-held line has an allocation`);
  return failures;
}
