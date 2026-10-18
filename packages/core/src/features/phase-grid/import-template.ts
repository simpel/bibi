import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { PhaseGridTemplate } from "../../templates/phase-grid/phase-grid-template";
import { checkReadable } from "../ticket/ticket-rules";
import { loadGrid } from "./load-grid";
import type { PhaseGridImportTemplateOutput } from "./schema";

export type ImportPhaseGridInput = { context: OperationContext; template: PhaseGridTemplate };

type Target = { phaseId: string; entityTypeId: string; stateId: string };

const READS = [
  ["ticketPhase:read", "phaseId"],
  ["itemState:read", "stateId"],
  ["configuration:read", "entityTypeId"],
] as const;

/** The template's cells for the organization's active phases and item types, by name. */
async function resolveTargets({ context, template }: ImportPhaseGridInput): Promise<Target[]> {
  const active = { status: "ACTIVE" } as const;
  const phases = await context.db.ticketPhase.findMany({ where: { ...active, terminal: false } });
  const types = await context.db.entityType.findMany({ where: { ...active, base: "ITEM" } });
  const states = await context.db.itemState.findMany({ where: active });
  return phases.flatMap((phase) =>
    types.flatMap((type) => {
      const own = states.filter((state) => state.entityTypeId === type.id);
      for (const cell of template.cells.filter((row) => row.phase === phase.name)) {
        const state = own.find((row) => row.name === cell.state);
        if (state) return [{ phaseId: phase.id, entityTypeId: type.id, stateId: state.id }];
      }
      return [];
    }),
  );
}

/**
 * Shared by `phaseGrid.importTemplate` and organization provisioning: sets the template's cells
 * where the grid has none and keeps every cell that is already set. Audited per cell.
 */
export async function importPhaseGrid({
  context,
  template,
}: ImportPhaseGridInput): Promise<Result<PhaseGridImportTemplateOutput>> {
  for (const [permission, path] of READS) {
    const readable = checkReadable({ context, permission, path });
    if (!readable.ok) return readable;
  }
  const set = await context.db.phaseStateRule.findMany({
    select: { phaseId: true, entityTypeId: true },
  });
  const taken = new Set(set.map((cell) => `${cell.phaseId}:${cell.entityTypeId}`));
  let applied = 0;
  for (const target of await resolveTargets({ context, template })) {
    if (taken.has(`${target.phaseId}:${target.entityTypeId}`)) continue;
    const { phaseId, entityTypeId } = target;
    const after = await context.db.phaseStateRule.upsert({
      where: { phaseId_entityTypeId: { phaseId, entityTypeId } },
      create: { organizationId: context.organizationId, ...target },
      update: {},
    });
    context.recordChange({ entityId: after.id, after });
    applied += 1;
  }
  return ok({ value: { applied, grid: await loadGrid({ context }) } });
}
