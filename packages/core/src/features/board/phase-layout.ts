import type { OperationContext } from "../../operations/types";

type Ctx = { context: Pick<OperationContext, "db" | "organizationId"> };

/** Writes `position = index` for each phase id, skipping phases already there. */
export async function setPhasePositions({ context, ids }: Ctx & { ids: readonly string[] }) {
  for (const [position, id] of ids.entries()) {
    await context.db.boardPhase.updateMany({
      where: { id, position: { not: position } },
      data: { position },
    });
  }
}

export type PlaceStatusInput = Ctx & { boardId: string; phaseId: string; statusId: string };

/** Shows a status in a phase; it leaves the phase it was in on the same board (one per board). */
export async function placeStatus({ context, boardId, phaseId, statusId }: PlaceStatusInput) {
  await context.db.boardPhaseStatus.deleteMany({ where: { boardId, statusId } });
  await context.db.boardPhaseStatus.create({
    data: { organizationId: context.organizationId, boardId, phaseId, statusId },
  });
}

type InsertPhaseInput = Ctx & {
  boardId: string;
  name: string;
  color: string;
  /** Index among the board's active phases; past the end places it last. */
  position: number;
};

/** Creates a phase at `position` and shifts the phases from there one step right. */
export async function insertPhase({ context, boardId, name, color, position }: InsertPhaseInput) {
  const phases = await context.db.boardPhase.findMany({
    where: { boardId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const at = Math.min(position, phases.length);
  const row = await context.db.boardPhase.create({
    data: { organizationId: context.organizationId, boardId, name, color, position: at },
  });
  const ids = phases.map(({ id }) => id);
  ids.splice(at, 0, row.id);
  await setPhasePositions({ context, ids });
  return row;
}

/** One phase per active status, open statuses first and closing ones last (a new board's layout). */
export async function mirrorStatuses({ context, boardId }: Ctx & { boardId: string }) {
  const statuses = await context.db.ticketStatus.findMany({
    orderBy: [{ closes: "asc" }, { position: "asc" }, { id: "asc" }],
  });
  for (const [position, ticketStatus] of statuses.entries()) {
    const { name, color, id: statusId } = ticketStatus;
    const phase = await context.db.boardPhase.create({
      data: { organizationId: context.organizationId, boardId, name, color, position },
    });
    await placeStatus({ context, boardId, phaseId: phase.id, statusId });
  }
}

/** The index after the board's last phase that shows an open status: where a new open status goes. */
export async function openStatusEnd({ context, boardId }: Ctx & { boardId: string }) {
  const phases = await context.db.boardPhase.findMany({
    where: { boardId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: { statuses: { select: { ticketStatus: { select: { closes: true } } } } },
  });
  const open = phases.map((phase) => phase.statuses.some((row) => !row.ticketStatus.closes));
  const last = open.lastIndexOf(true);
  return last === -1 ? 0 : last + 1;
}
