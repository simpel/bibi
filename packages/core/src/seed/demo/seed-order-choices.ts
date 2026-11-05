import { ok, type Result } from "../../errors/result";
import { assignAssignment, unfollowAssignment } from "../../features/assignment/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoOrder } from "./order-types";
import type { DemoUserIds } from "./users";

export type SeedOrderChoicesInput = {
  context: ExecuteContext;
  orderId: string;
  order: Pick<DemoOrder, "choices">;
  userIds: DemoUserIds;
};

/**
 * ADR 0055: the explicit assignee and unfollow choices of an order, through `assignment.assign`
 * and `assignment.unfollow` like a person would make them. Everything else stays derived.
 */
export async function seedOrderChoices({
  context,
  orderId,
  order,
  userIds,
}: SeedOrderChoicesInput): Promise<Result<true>> {
  for (const choice of order.choices ?? []) {
    const responsibility = await context.db.responsibility.findFirst({
      where: { name: choice.responsibility },
    });
    if (!responsibility) return missing({ what: `responsibility ${choice.responsibility}` });
    const slot = { subjectType: "ORDER" as const, subjectId: orderId };
    const input = { ...slot, responsibilityId: responsibility.id };
    const assignee = choice.assignee ? userIds.get(choice.assignee) : null;
    if (choice.assignee && !assignee) return missing({ what: `user ${choice.assignee}` });
    if (assignee) {
      const assigned = await execute({
        operation: assignAssignment,
        input: { ...input, assigneeId: assignee },
        context,
      });
      if (!assigned.ok) return assigned;
    }
    const leaver = choice.unfollow ? userIds.get(choice.unfollow) : null;
    if (choice.unfollow && !leaver) return missing({ what: `user ${choice.unfollow}` });
    if (leaver) {
      const left = await execute({
        operation: unfollowAssignment,
        input: { ...input, userId: leaver },
        context,
      });
      if (!left.ok) return left;
    }
  }
  return ok({ value: true });
}
