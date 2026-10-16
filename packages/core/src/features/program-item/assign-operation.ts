import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { checkMembers } from "../../shared/check-members";
import { notFound } from "../../shared/errors";
import { ProgramItemAssignInputSchema, ProgramItemSchema } from "./schema";
import { loadProgramItem, toProgramItemDto } from "./to-program-item-dto";

export const assignProgramItem = defineOperation({
  name: "programItem.assign",
  kind: "command",
  description:
    "Set or change who is responsible for a program item (ADR 0022). The person must be a " +
    "member of the organization (member.list userId); null removes the responsible person.",
  input: ProgramItemAssignInputSchema,
  output: ProgramItemSchema,
  permission: "programItem:write",
  handler: async ({ input: { id, responsibleId }, context }) => {
    const before = await loadProgramItem({ context, id });
    if (!before) return notFound({ entity: "Program item" });
    const member = await checkMembers({ context, userIds: { responsibleId } });
    if (!member.ok) return member;
    const row = await context.db.programItem.update({ where: { id }, data: { responsibleId } });
    const programItem = toProgramItemDto({ row });
    context.recordChange({ entityId: id, before, after: programItem });
    return ok({ value: programItem });
  },
});
