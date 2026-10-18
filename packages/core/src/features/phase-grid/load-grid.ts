import type { OperationContext } from "../../operations/types";
import type { PhaseGridDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * Only cells whose phase, item type and state are all active count, and never a terminal phase's
 * (terminal phases release every line, ADR 0044).
 */
const ACTIVE_CELL = {
  phase: { status: "ACTIVE", terminal: false },
  entityType: { status: "ACTIVE" },
  state: { status: "ACTIVE" },
} as const;

const NAMES = {
  phase: { select: { name: true } },
  entityType: { select: { name: true } },
  state: { select: { name: true, color: true } },
} as const;

export type LoadGridInput = Db & { phaseId?: string | undefined };

/** The grid's set cells (of one phase, or all), in phase and then type order. */
export async function loadGrid({ context, phaseId }: LoadGridInput): Promise<PhaseGridDto> {
  const rows = await context.db.phaseStateRule.findMany({
    where: { ...ACTIVE_CELL, ...(phaseId ? { phaseId } : {}) },
    orderBy: [{ phase: { position: "asc" } }, { entityType: { name: "asc" } }, { id: "asc" }],
    include: NAMES,
  });
  const cells = rows.map(({ phase, entityType, state, ...cell }) => ({
    ...cell,
    phaseName: phase.name,
    entityTypeName: entityType.name,
    stateName: state.name,
    stateColor: state.color,
  }));
  return { cells };
}

export type CellsOfPhaseInput = Db & { phaseId: string; entityTypeIds: readonly string[] };

/** The phase's cells for the given item types: item type id → state id. Unset cells are absent. */
export async function cellsOfPhase({
  context,
  phaseId,
  entityTypeIds,
}: CellsOfPhaseInput): Promise<Map<string, string>> {
  if (entityTypeIds.length === 0) return new Map();
  const cells = await context.db.phaseStateRule.findMany({
    where: { ...ACTIVE_CELL, phaseId, entityTypeId: { in: [...entityTypeIds] } },
    select: { entityTypeId: true, stateId: true },
  });
  return new Map(cells.map((cell) => [cell.entityTypeId, cell.stateId]));
}

export type CellOfTicketInput = Db & { ticketId: string; entityTypeId: string };

/**
 * The state the cell of the ticket's current phase gives a line of the item type, or null when
 * the cell is empty ("keep") or the ticket is unknown.
 */
export async function cellOfTicket({ context, ticketId, entityTypeId }: CellOfTicketInput) {
  const ticket = await context.db.ticket.findFirst({
    where: { id: ticketId },
    select: { phaseId: true },
  });
  if (!ticket) return null;
  const cells = await cellsOfPhase({
    context,
    phaseId: ticket.phaseId,
    entityTypeIds: [entityTypeId],
  });
  return cells.get(entityTypeId) ?? null;
}
