import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid } from "../../shared/errors";
import { checkSubject } from "./check-slot";
import { listMineAssignments } from "./list-mine";
import { listSubjectAssignments } from "./list-subject";
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
    "List who answers for a ticket or an item and who follows it: the main " +
    "assignment (responsibilityId null) first, then one per responsibility on a ticket " +
    "(ADR 0055). Only explicit choices are stored: the responsibilities that apply come from the " +
    "ticket's lines, and a responsibility's default assignee and followers apply unless chosen " +
    "otherwise. `assigneeSource` and each follower's `source` say EXPLICIT or DEFAULT.",
  input: AssignmentListInputSchema,
  output: AssignmentListOutputSchema,
  permission: "assignment:read",
  handler: async ({ input, context }) => {
    const subject = await checkSubject({ context, ...input });
    if (!subject.ok) return subject;
    return ok({ value: { items: await listSubjectAssignments({ context, ...input }) } });
  },
});

export const listMyAssignments = defineOperation({
  name: "assignment.listMine",
  kind: "query",
  description:
    "List the signed-in member's assignments, newest first: ASSIGNED (what they answer for) or " +
    "FOLLOWING (what they follow), including what their responsibilities' defaults give them on " +
    "tickets (ADR 0055). Each row names its subject (subjectType, subjectId).",
  input: AssignmentListMineInputSchema,
  output: AssignmentListMineOutputSchema,
  permission: "assignment:read",
  handler: async ({ input: { kind, subjectType, ...pageInput }, context }) => {
    const userId = context.actor.userId;
    if (!userId) return invalid({ message: "assignment.listMine needs a signed-in member" });
    const page = { context, userId, kind, subjectType, ...pageInput };
    return ok({ value: await listMineAssignments(page) });
  },
});
