import type { z } from "zod";
import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { loadBoard } from "./load-board";
import { placeStatus, setPhasePositions } from "./phase-layout";
import type { BoardPhaseMoveStatusInputSchema, BoardPhaseReorderInputSchema } from "./schema";
import { BoardSchema } from "./schema";

const problem = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

export const reorderBoardPhasesHandler = async ({
  input: { boardId, ids },
  context,
}: HandlerInput<z.infer<typeof BoardPhaseReorderInputSchema>>) => {
  const before = await loadBoard({ context, id: boardId });
  if (!before) return notFound({ entity: "Board" });
  const known = new Set(before.phases.map((phase) => phase.id));
  const complete = ids.length === known.size && new Set(ids).size === ids.length;
  if (!complete || ids.some((id) => !known.has(id))) {
    return problem({ path: "ids", message: "List every active phase of the board exactly once" });
  }
  await setPhasePositions({ context, ids });
  const after = await loadBoard({ context, id: boardId });
  if (!after) return notFound({ entity: "Board" });
  context.recordChange({ entityId: boardId, before, after });
  return ok({ value: after });
};

export const moveBoardPhaseStatusHandler = async ({
  input: { boardId, statusId, phaseId },
  context,
}: HandlerInput<z.infer<typeof BoardPhaseMoveStatusInputSchema>>) => {
  const before = await loadBoard({ context, id: boardId });
  if (!before) return notFound({ entity: "Board" });
  if (!(await context.db.ticketStatus.findFirst({ where: { id: statusId } }))) {
    return problem({ path: "statusId", message: "Unknown or archived ticket status" });
  }
  if (phaseId === null) {
    await context.db.boardPhaseStatus.deleteMany({ where: { boardId, statusId } });
  } else {
    if (!before.phases.some((phase) => phase.id === phaseId)) {
      return problem({ path: "phaseId", message: "Not a phase of this board" });
    }
    await placeStatus({ context, boardId, phaseId, statusId });
  }
  const after = await loadBoard({ context, id: boardId });
  if (!after) return notFound({ entity: "Board" });
  context.recordChange({ entityId: boardId, before, after });
  return ok({ value: after });
};
