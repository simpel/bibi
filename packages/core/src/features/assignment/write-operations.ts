import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { checkMembers } from "../../shared/check-members";
import { notFound } from "../../shared/errors";
import { checkAssigneeKept } from "./check-assignee-kept";
import { checkSlot } from "./check-slot";
import {
  AssignmentAssignInputSchema,
  AssignmentFollowInputSchema,
  AssignmentSchema,
} from "./schema";
import { addFollower, removeFollower, saveAssignee } from "./write-assignment";

export const assignAssignment = defineOperation({
  name: "assignment.assign",
  kind: "command",
  description:
    "Set who answers for an inquiry, a booking or an item (ADR 0034): its main assignee, or, " +
    "with `responsibilityId`, the assignee for that responsibility on a booking. The assignee " +
    "must be a member (member.list userId). null removes the assignee, which is refused " +
    "(CONFLICT) for the main assignee of a booking from CONFIRMED or an inquiry from QUALIFIED.",
  input: AssignmentAssignInputSchema,
  output: AssignmentSchema,
  permission: "assignment:write",
  handler: async ({ input: { assigneeId, ...slot }, context }) => {
    const valid = await checkSlot({ context, ...slot });
    if (!valid.ok) return valid;
    if (assigneeId === null) {
      const kept = await checkAssigneeKept({ context, ...slot });
      if (!kept.ok) return kept;
    }
    const member = await checkMembers({ context, userIds: { assigneeId } });
    if (!member.ok) return member;
    return ok({ value: await saveAssignee({ context, ...slot, assigneeId }) });
  },
});

export const followAssignment = defineOperation({
  name: "assignment.follow",
  kind: "command",
  description:
    "Add a follower to an inquiry, a booking or an item (or, with `responsibilityId`, to that " +
    "part of a booking). Followers stay informed and see it in Following; they are never " +
    "required by rules. The user must be a member. Following twice changes nothing.",
  input: AssignmentFollowInputSchema,
  output: AssignmentSchema,
  permission: "assignment:write",
  handler: async ({ input: { userId, ...slot }, context }) => {
    const valid = await checkSlot({ context, ...slot });
    if (!valid.ok) return valid;
    const member = await checkMembers({ context, userIds: { userId } });
    if (!member.ok) return member;
    return ok({ value: await addFollower({ context, ...slot, userId }) });
  },
});

export const unfollowAssignment = defineOperation({
  name: "assignment.unfollow",
  kind: "command",
  description:
    "Remove a follower from an inquiry, a booking or an item (or from that responsibility on a " +
    "booking). Removing someone who does not follow changes nothing; NOT_FOUND when the " +
    "subject has no such assignment.",
  input: AssignmentFollowInputSchema,
  output: AssignmentSchema,
  permission: "assignment:write",
  handler: async ({ input: { userId, ...slot }, context }) => {
    const valid = await checkSlot({ context, ...slot });
    if (!valid.ok) return valid;
    const removed = await removeFollower({ context, ...slot, userId });
    return removed ? ok({ value: removed }) : notFound({ entity: "Assignment" });
  },
});
