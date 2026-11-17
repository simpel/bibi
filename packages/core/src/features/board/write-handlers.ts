import type { z } from "zod";
import { ok } from "../../errors/result";
import type { HandlerInput, OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkBoardFilter } from "./check-filter";
import { loadEditableBoard } from "./editable";
import { loadBoard } from "./load-board";
import { mirrorStatuses } from "./phase-layout";
import type { BoardCreateInputSchema, BoardUpdateInputSchema } from "./schema";

const nameTaken = ({ name }: { name: string }) =>
  conflict({ message: `You already have a view named "${name}"` });

type NameInput = {
  context: Pick<OperationContext, "db">;
  name: string;
  ownerId: string | null;
  isDefault: boolean;
  exceptId?: string;
};

/** A view's name is unique per owner; the default view counts as everyone's (ADR 0111). */
async function nameUsed({ context, name, ownerId, isDefault, exceptId }: NameInput) {
  const owners = isDefault ? {} : { OR: [{ ownerId }, { isDefault: true }] };
  const where = { name, ...owners, ...(exceptId ? { id: { not: exceptId } } : {}) };
  return (await context.db.board.count({ where })) > 0;
}

export const createBoardHandler = async ({
  input,
  context,
}: HandlerInput<z.infer<typeof BoardCreateInputSchema>>) => {
  const { name, entityTypeId = null, assigneeId = null } = input;
  const ownerId = context.actor.userId;
  if (await nameUsed({ context, name, ownerId, isDefault: false })) return nameTaken({ name });
  const filter = await checkBoardFilter({ context, entityTypeId, assigneeId });
  if (!filter.ok) return filter;
  const data = { organizationId: context.organizationId, name, entityTypeId, assigneeId, ownerId };
  const row = await context.db.board.create({ data });
  await mirrorStatuses({ context, boardId: row.id });
  const board = await loadBoard({ context, id: row.id });
  if (!board) return notFound({ entity: "Board" });
  context.recordChange({ entityId: row.id, after: board });
  return ok({ value: board });
};

export const updateBoardHandler = async ({
  input: { id, ...data },
  context,
}: HandlerInput<z.infer<typeof BoardUpdateInputSchema>>) => {
  const editable = await loadEditableBoard({ context, id });
  if (!editable.ok) return editable;
  const before = editable.value;
  const { name } = data;
  if (name !== undefined && name !== before.name) {
    const { ownerId, isDefault } = before;
    if (await nameUsed({ context, name, ownerId, isDefault, exceptId: id })) {
      return nameTaken({ name });
    }
  }
  const { entityTypeId, assigneeId } = data;
  const filter = await checkBoardFilter({ context, entityTypeId, assigneeId });
  if (!filter.ok) return filter;
  await context.db.board.update({ where: { id }, data });
  const after = await loadBoard({ context, id });
  if (!after) return notFound({ entity: "Board" });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};
