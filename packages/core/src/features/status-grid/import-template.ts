import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { StatusGridTemplate } from "../../templates/status-grid/status-grid-template";
import { checkReadable } from "../ticket/ticket-rules";
import { loadGrid } from "./load-grid";
import type { StatusGridImportTemplateOutput } from "./schema";

export type ImportStatusGridInput = { context: OperationContext; template: StatusGridTemplate };

type Target = { statusId: string; entityTypeId: string; stateId: string };

const READS = [
  ["pipeline:read", "statusId"],
  ["pipeline:read", "stateId"],
  ["configuration:read", "entityTypeId"],
] as const;

/** The template's cells for the organization's active statuses and item types, by name. */
async function resolveTargets({ context, template }: ImportStatusGridInput): Promise<Target[]> {
  const active = { status: "ACTIVE" } as const;
  const statuses = await context.db.ticketStatus.findMany({ where: { ...active, closes: false } });
  const types = await context.db.entityType.findMany({ where: { ...active, base: "ITEM" } });
  const states = await context.db.itemState.findMany({ where: active });
  return statuses.flatMap((ticketStatus) =>
    types.flatMap((type) => {
      const own = states.filter((state) => state.entityTypeId === type.id);
      for (const cell of template.cells.filter((row) => row.status === ticketStatus.name)) {
        const state = own.find((row) => row.name === cell.state);
        if (state) return [{ statusId: ticketStatus.id, entityTypeId: type.id, stateId: state.id }];
      }
      return [];
    }),
  );
}

/**
 * Shared by `statusGrid.importTemplate` and organization provisioning: sets the template's cells
 * where the grid has none and keeps every cell that is already set. Audited per cell.
 */
export async function importStatusGrid({
  context,
  template,
}: ImportStatusGridInput): Promise<Result<StatusGridImportTemplateOutput>> {
  for (const [permission, path] of READS) {
    const readable = checkReadable({ context, permission, path });
    if (!readable.ok) return readable;
  }
  const set = await context.db.statusStateRule.findMany({
    select: { statusId: true, entityTypeId: true },
  });
  const taken = new Set(set.map((cell) => `${cell.statusId}:${cell.entityTypeId}`));
  let applied = 0;
  for (const target of await resolveTargets({ context, template })) {
    if (taken.has(`${target.statusId}:${target.entityTypeId}`)) continue;
    const { statusId, entityTypeId } = target;
    const after = await context.db.statusStateRule.upsert({
      where: { statusId_entityTypeId: { statusId, entityTypeId } },
      create: { organizationId: context.organizationId, ...target },
      update: {},
    });
    context.recordChange({ entityId: after.id, after });
    applied += 1;
  }
  return ok({ value: { applied, grid: await loadGrid({ context }) } });
}
