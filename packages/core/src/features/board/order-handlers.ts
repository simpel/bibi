import type { z } from "zod";
import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { checkMembers } from "../../shared/check-members";
import { conflict, notFound } from "../../shared/errors";
import { loadManagedBoard } from "./editable";
import { loadAnyBoard } from "./load-board";
import type { BoardIdInputSchema, BoardShareInputSchema } from "./schema";

const defaultIsShared = () =>
  conflict({ message: "The default view is always shared with the whole organization" });

/** `board.share`: replaces who a view is shared with (ADR 0111). */
export const shareBoardHandler = async ({
  input: { id, organization, userIds },
  context,
}: HandlerInput<z.infer<typeof BoardShareInputSchema>>) => {
  const managed = await loadManagedBoard({ context, id });
  if (!managed.ok) return managed;
  const before = managed.value;
  if (before.isDefault) return defaultIsShared();
  const wanted = [...new Set(userIds)].filter((userId) => userId !== before.ownerId);
  const members = await checkMembers({
    context,
    userIds: Object.fromEntries(wanted.map((userId, index) => [`userIds.${index}`, userId])),
  });
  if (!members.ok) return members;
  await context.db.board.update({ where: { id }, data: { sharedWithOrganization: organization } });
  await context.db.boardShare.deleteMany({ where: { boardId: id, userId: { notIn: wanted } } });
  const kept = new Set(before.sharedWithUserIds);
  for (const userId of wanted.filter((candidate) => !kept.has(candidate))) {
    await context.db.boardShare.create({
      data: { organizationId: context.organizationId, boardId: id, userId },
    });
  }
  // A manager who just made it private may no longer see it: read it back as is.
  const after = await loadAnyBoard({ context, id });
  if (!after) return notFound({ entity: "Board" });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};

export const archiveBoardHandler = async ({
  input: { id },
  context,
}: HandlerInput<z.infer<typeof BoardIdInputSchema>>) => {
  const managed = await loadManagedBoard({ context, id });
  if (!managed.ok) return managed;
  const before = managed.value;
  if (before.isDefault) return conflict({ message: "The default view cannot be archived" });
  await context.db.boardPhaseStatus.deleteMany({ where: { boardId: id } });
  await context.db.boardPhase.updateMany({
    where: { boardId: id },
    data: { status: "ARCHIVED" },
  });
  await context.db.board.update({ where: { id }, data: { status: "ARCHIVED" } });
  const after = { ...before, phases: [], status: "ARCHIVED" as const };
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};
