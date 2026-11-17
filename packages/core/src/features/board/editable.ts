import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { checkBoardEdit, checkBoardManage } from "./access";
import { loadBoard, loadBoardPhase } from "./load-board";
import type { BoardDto, BoardPhaseDto } from "./schema";

type Ctx = { context: Pick<OperationContext, "db" | "actor" | "permissions"> };

/** A view the caller sees and may edit (ADR 0111); `NOT_FOUND` when they do not see it. */
export async function loadEditableBoard({
  context,
  id,
}: Ctx & { id: string }): Promise<Result<BoardDto>> {
  const board = await loadBoard({ context, id });
  if (!board) return notFound({ entity: "Board" });
  const allowed = checkBoardEdit({ context, board });
  return allowed.ok ? ok({ value: board }) : allowed;
}

/** A view whose sharing the caller may change and which they may archive (ADR 0111). */
export async function loadManagedBoard({
  context,
  id,
}: Ctx & { id: string }): Promise<Result<BoardDto>> {
  const board = await loadBoard({ context, id });
  if (!board) return notFound({ entity: "Board" });
  const allowed = checkBoardManage({ context, board });
  return allowed.ok ? ok({ value: board }) : allowed;
}

/** A phase of a view the caller may edit; a phase of a view they do not see is `NOT_FOUND`. */
export async function loadEditablePhase({
  context,
  id,
}: Ctx & { id: string }): Promise<Result<BoardPhaseDto>> {
  const phase = await loadBoardPhase({ context, id });
  if (!phase) return notFound({ entity: "Board phase" });
  const board = await loadEditableBoard({ context, id: phase.boardId });
  if (!board.ok)
    return board.error.code === "NOT_FOUND" ? notFound({ entity: "Board phase" }) : board;
  return ok({ value: phase });
}
