import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { checkSubject } from "./check-slot";
import { toAssignmentDto, WITH_FOLLOWERS } from "./load-assignment";
import {
  AssignmentListInputSchema,
  AssignmentListMineInputSchema,
  AssignmentListMineOutputSchema,
  AssignmentListOutputSchema,
} from "./schema";

export const listAssignments = defineOperation({
  name: "assignment.list",
  kind: "query",
  description:
    "List who answers for an inquiry, a booking or an item and who follows it: the main " +
    "assignment (responsibilityId null) first, then one per responsibility on a booking.",
  input: AssignmentListInputSchema,
  output: AssignmentListOutputSchema,
  permission: "assignment:read",
  handler: async ({ input, context }) => {
    const subject = await checkSubject({ context, ...input });
    if (!subject.ok) return subject;
    const rows = await context.db.assignment.findMany({
      where: input,
      include: WITH_FOLLOWERS,
      orderBy: [{ responsibilityId: { sort: "asc", nulls: "first" } }, { id: "asc" }],
    });
    return ok({ value: { items: rows.map((row) => toAssignmentDto({ row })) } });
  },
});

export const listMyAssignments = defineOperation({
  name: "assignment.listMine",
  kind: "query",
  description:
    "List the signed-in member's assignments, newest first: ASSIGNED (what they answer for) or " +
    "FOLLOWING (what they follow). Each row names its subject (subjectType, subjectId).",
  input: AssignmentListMineInputSchema,
  output: AssignmentListMineOutputSchema,
  permission: "assignment:read",
  handler: async ({ input: { kind, subjectType, ...page }, context }) => {
    const userId = context.actor.userId;
    if (!userId) return invalid({ message: "assignment.listMine needs a signed-in member" });
    const mine = kind === "ASSIGNED" ? { assigneeId: userId } : { followers: { some: { userId } } };
    const rows = await context.db.assignment.findMany({
      where: { ...mine, ...(subjectType ? { subjectType } : {}) },
      include: WITH_FOLLOWERS,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageArgs(page),
    });
    const items = paginate({ rows, limit: page.limit });
    return ok({ value: { ...items, items: items.items.map((row) => toAssignmentDto({ row })) } });
  },
});
