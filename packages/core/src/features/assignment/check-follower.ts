import { appError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import type { AssignmentSubjectType } from "./schema";

export type CheckFollowerInput = {
  context: Pick<OperationContext, "actor" | "permissions">;
  subjectType: AssignmentSubjectType;
  /** The member whose follow changes. */
  userId: string;
};

/**
 * Anyone who may view an order follows or unfollows it for themselves (the operation needs
 * `order:read`). Changing someone else's follow is an edit of the order and needs `order:write`;
 * an API key has no self, so it always needs it. An item also needs `item:read`.
 */
export function checkFollower({ context, subjectType, userId }: CheckFollowerInput): Result<true> {
  const { permissions } = context;
  if (subjectType === "ITEM" && !hasPermission({ permissions, permission: "item:read" })) {
    return err({ error: appError({ code: "FORBIDDEN", message: "Missing permission item:read" }) });
  }
  const self = context.actor.userId !== null && context.actor.userId === userId;
  if (self || hasPermission({ permissions, permission: "order:write" })) return ok({ value: true });
  const message = "Following for someone else needs order:write";
  return err({ error: appError({ code: "FORBIDDEN", message }) });
}
