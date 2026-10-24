import type { OperationContext } from "../../operations/types";
import type { StatusGridDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * Only cells whose status, item type and state are all active count, and never a closing status's
 * (closing statuses release every line, ADR 0044).
 */
const ACTIVE_CELL = {
  ticketStatus: { status: "ACTIVE", closes: false },
  entityType: { status: "ACTIVE" },
  state: { status: "ACTIVE" },
} as const;

const NAMES = {
  ticketStatus: { select: { name: true } },
  entityType: { select: { name: true } },
  state: { select: { name: true, color: true } },
} as const;

export type LoadGridInput = Db & { statusId?: string | undefined };

/** The grid's set cells (of one status, or all), in status and then type order. */
export async function loadGrid({ context, statusId }: LoadGridInput): Promise<StatusGridDto> {
  const rows = await context.db.statusStateRule.findMany({
    where: { ...ACTIVE_CELL, ...(statusId ? { statusId } : {}) },
    orderBy: [
      { ticketStatus: { position: "asc" } },
      { entityType: { name: "asc" } },
      { id: "asc" },
    ],
    include: NAMES,
  });
  const cells = rows.map(({ ticketStatus, entityType, state, ...cell }) => ({
    ...cell,
    statusName: ticketStatus.name,
    entityTypeName: entityType.name,
    stateName: state.name,
    stateColor: state.color,
  }));
  return { cells };
}

export type CellsOfStatusInput = Db & { statusId: string; entityTypeIds: readonly string[] };

/** The status's cells for the given item types: item type id → state id. Unset cells are absent. */
export async function cellsOfStatus({
  context,
  statusId,
  entityTypeIds,
}: CellsOfStatusInput): Promise<Map<string, string>> {
  if (entityTypeIds.length === 0) return new Map();
  const cells = await context.db.statusStateRule.findMany({
    where: { ...ACTIVE_CELL, statusId, entityTypeId: { in: [...entityTypeIds] } },
    select: { entityTypeId: true, stateId: true },
  });
  return new Map(cells.map((cell) => [cell.entityTypeId, cell.stateId]));
}

export type CellOfTicketInput = Db & { ticketId: string; entityTypeId: string };

/**
 * The state the cell of the ticket's current status gives a line of the item type, or null when
 * the cell is empty ("keep") or the ticket is unknown.
 */
export async function cellOfTicket({ context, ticketId, entityTypeId }: CellOfTicketInput) {
  const ticket = await context.db.ticket.findFirst({
    where: { id: ticketId },
    select: { statusId: true },
  });
  if (!ticket) return null;
  const cells = await cellsOfStatus({
    context,
    statusId: ticket.statusId,
    entityTypeIds: [entityTypeId],
  });
  return cells.get(entityTypeId) ?? null;
}
