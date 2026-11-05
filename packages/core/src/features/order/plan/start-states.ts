import type { HoldKind } from "@bibi/db";
import type { OperationContext } from "../../../operations/types";
import { cellsOfStatus } from "../../status-grid/load-grid";

type Db = { context: Pick<OperationContext, "db"> };

/** The state a new line of an item type starts in, with the flags that decide its hold. */
export type StartState = { id: string; hold: HoldKind; released: boolean };

export type LoadStartStatesInput = Db & { statusId: string; entityTypeIds: readonly string[] };

/**
 * Item type id → the state its new lines start in for the status (ADR 0044, ADR 0081 decision
 * 8): the grid cell of the status, else the type's initial state, exactly as `line.create` picks
 * it. Types with neither are absent. Three queries for any number of types.
 */
export async function loadStartStates({
  context,
  statusId,
  entityTypeIds,
}: LoadStartStatesInput): Promise<Map<string, StartState>> {
  if (entityTypeIds.length === 0) return new Map();
  const [cells, initials] = await Promise.all([
    cellsOfStatus({ context, statusId, entityTypeIds }),
    context.db.itemState.findMany({
      where: { entityTypeId: { in: [...entityTypeIds] }, initial: true },
      select: { id: true, entityTypeId: true },
    }),
  ]);
  const initialOf = new Map(initials.map((state) => [state.entityTypeId, state.id]));
  const chosen = new Map<string, string>();
  for (const typeId of entityTypeIds) {
    const stateId = cells.get(typeId) ?? initialOf.get(typeId);
    if (stateId) chosen.set(typeId, stateId);
  }
  const states = await context.db.itemState.findMany({
    where: { id: { in: [...new Set(chosen.values())] } },
    select: { id: true, hold: true, released: true },
  });
  const byId = new Map(states.map((state) => [state.id, state]));
  const out = new Map<string, StartState>();
  for (const [typeId, stateId] of chosen) {
    const state = byId.get(stateId);
    if (state) out.set(typeId, state);
  }
  return out;
}
