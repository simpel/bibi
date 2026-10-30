import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadBoard } from "./load-board";
import { insertPhase, mirrorStatuses, openStatusEnd, placeStatus } from "./phase-layout";

type Ctx = { context: Pick<OperationContext, "db" | "organizationId" | "recordChange"> };

/** The default board's name; boards are data, so staff rename it like any other. */
const DEFAULT_BOARD_NAME = "Pipeline";

/** Runs a layout change on a board and audits it on that board (ADR 0067). */
async function auditedOnBoard({
  context,
  boardId,
  change,
}: Ctx & { boardId: string; change: () => Promise<unknown> }) {
  const before = await loadBoard({ context, id: boardId });
  await change();
  const after = await loadBoard({ context, id: boardId });
  context.recordChange({ entityType: "board", entityId: boardId, before, after });
}

/** A first board, mirroring every active status (the new one included). */
async function createDefaultBoard({ context }: Ctx) {
  const data = { organizationId: context.organizationId, name: DEFAULT_BOARD_NAME, position: 0 };
  const board = await context.db.board.create({ data });
  await mirrorStatuses({ context, boardId: board.id });
  const after = await loadBoard({ context, id: board.id });
  context.recordChange({ entityType: "board", entityId: board.id, after });
}

export type PlaceNewStatusInput = Ctx & {
  status: { id: string; name: string; color: string; closes: boolean };
  /** A phase to show it in; omitted gives it its own phase on the default board. */
  phaseId: string | undefined;
};

/**
 * Where a new ticket status shows (ADR 0067): in the given phase, or as its own phase on the
 * default board, after the open statuses' phases unless it closes. Other boards leave it off.
 */
export async function placeNewStatus({
  context,
  status,
  phaseId,
}: PlaceNewStatusInput): Promise<Result<true>> {
  if (phaseId) {
    const phase = await context.db.boardPhase.findFirst({ where: { id: phaseId } });
    if (!phase) {
      const message = "Unknown board phase";
      return invalid({ message, issues: [{ path: "phaseId", message }] });
    }
    const { boardId } = phase;
    const change = () => placeStatus({ context, boardId, phaseId, statusId: status.id });
    await auditedOnBoard({ context, boardId, change });
    return ok({ value: true });
  }
  const board = await context.db.board.findFirst({ orderBy: [{ position: "asc" }, { id: "asc" }] });
  if (!board) {
    await createDefaultBoard({ context });
    return ok({ value: true });
  }
  const boardId = board.id;
  const change = async () => {
    const end = status.closes ? Number.MAX_SAFE_INTEGER : await openStatusEnd({ context, boardId });
    const { name, color } = status;
    const phase = await insertPhase({ context, boardId, name, color, position: end });
    await placeStatus({ context, boardId, phaseId: phase.id, statusId: status.id });
  };
  await auditedOnBoard({ context, boardId, change });
  return ok({ value: true });
}

/**
 * An archived status leaves every board (ADR 0067). A phase it leaves empty is archived too: it
 * showed only that status.
 */
export async function unplaceStatus({ context, statusId }: Ctx & { statusId: string }) {
  const rows = await context.db.boardPhaseStatus.findMany({ where: { statusId } });
  for (const { boardId, phaseId } of rows) {
    const change = async () => {
      await context.db.boardPhaseStatus.deleteMany({ where: { boardId, statusId } });
      if ((await context.db.boardPhaseStatus.count({ where: { phaseId } })) > 0) return;
      await context.db.boardPhase.update({ where: { id: phaseId }, data: { status: "ARCHIVED" } });
    };
    await auditedOnBoard({ context, boardId, change });
  }
}
