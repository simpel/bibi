import type { z } from "zod";
import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkBoardFilter } from "./check-filter";
import { loadBoard } from "./load-board";
import { mirrorStatuses } from "./phase-layout";
import { type BoardCreateInputSchema, BoardSchema, type BoardUpdateInputSchema } from "./schema";

const nameTaken = ({ name }: { name: string }) =>
  conflict({ message: `A board named "${name}" exists` });

export const createBoardHandler = async ({
  input,
  context,
}: HandlerInput<z.infer<typeof BoardCreateInputSchema>>) => {
  const { name, entityTypeId = null, assigneeId = null } = input;
  if (await context.db.board.findFirst({ where: { name } })) return nameTaken({ name });
  const filter = await checkBoardFilter({ context, entityTypeId, assigneeId });
  if (!filter.ok) return filter;
  const last = await context.db.board.findFirst({ orderBy: { position: "desc" } });
  const row = await context.db.board.create({
    data: {
      organizationId: context.organizationId,
      name,
      entityTypeId,
      assigneeId,
      position: last ? last.position + 1 : 0,
    },
  });
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
  const before = await loadBoard({ context, id });
  if (!before) return notFound({ entity: "Board" });
  const { name } = data;
  if (name !== undefined && name !== before.name) {
    const other = await context.db.board.findFirst({ where: { name, id: { not: id } } });
    if (other) return nameTaken({ name });
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
