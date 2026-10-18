import type { AppErrorIssue } from "../../errors/app-error";
import type { OperationContext } from "../../operations/types";
import { loadStatesById } from "../item-state/load-item-state";
import { cellsOfPhase } from "../phase-grid/load-grid";
import { holdCollisions } from "../program-item/hold-collisions";
import type { ProgramItemDto } from "../program-item/schema";
import type { PlannedLine } from "./plan-template-lines";

export type TemplateCollisionsInput = {
  context: Pick<OperationContext, "db">;
  phaseId: string;
  lines: readonly PlannedLine[];
};

const unique = ({ ids }: { ids: readonly (string | null | undefined)[] }) => [
  ...new Set(ids.filter((id): id is string => Boolean(id))),
];

/** A planned line as the line it will become, for the collision check (id = its index in the template). */
const asLine = ({ line, index }: { line: PlannedLine; index: number }): ProgramItemDto => ({
  ...{ id: String(index), organizationId: "", ticketId: "", status: "ACTIVE", createdBy: null },
  ...{ entityTypeId: line.entityTypeId, name: line.name, fields: {}, note: null },
  ...{ startsAt: line.startsAt, endsAt: line.endsAt, quantity: line.quantity ?? null },
  ...{ itemId: line.itemId ?? null, setupId: line.setupId ?? null },
  ...{
    stateId: null,
    stateOverridden: false,
    heldAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

/**
 * Every hard-hold collision the planned lines would cause (ADR 0044), found before anything is
 * created: each line gets the state the phase grid gives its item's type for the start phase
 * (else the type's initial state) and is checked as the move into that state would be.
 */
export async function templateCollisions({
  context,
  phaseId,
  lines,
}: TemplateCollisionsInput): Promise<AppErrorIssue[]> {
  const items = await context.db.item.findMany({
    where: { id: { in: unique({ ids: lines.map((line) => line.itemId) }) } },
    select: { id: true, entityTypeId: true },
  });
  const typeOf = new Map(items.map((item) => [item.id, item.entityTypeId]));
  const typeIds = unique({ ids: items.map((item) => item.entityTypeId) });
  const cells = await cellsOfPhase({ context, phaseId, entityTypeIds: typeIds });
  const initials = await context.db.itemState.findMany({
    where: { entityTypeId: { in: typeIds }, initial: true },
    select: { id: true, entityTypeId: true },
  });
  const initialOf = new Map(initials.map((state) => [state.entityTypeId, state.id]));
  const stateIds = [...cells.values(), ...initialOf.values()];
  const states = await loadStatesById({ context, ids: stateIds });
  const issues: AppErrorIssue[] = [];
  for (const [index, line] of lines.entries()) {
    const typeId = line.itemId ? typeOf.get(line.itemId) : undefined;
    const stateId = typeId ? (cells.get(typeId) ?? initialOf.get(typeId)) : undefined;
    const to = stateId ? states.get(stateId) : undefined;
    if (to) issues.push(...(await holdCollisions({ context, line: asLine({ line, index }), to })));
  }
  return issues;
}
