import { appError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { hasPermission, type Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import type { AssignmentSubjectType } from "./schema";

/** What a subject needs besides `order:read` to be followed. */
const SUBJECT_READ: Partial<Record<AssignmentSubjectType, Permission>> = {
  ITEM: "item:read",
  TASK: "task:read",
};

export type CheckFollowerInput = {
  context: Pick<OperationContext, "actor" | "permissions">;
  subjectType: AssignmentSubjectType;
  /** The member whose follow changes. */
  userId: string;
};

/**
 * Anyone who may view an order follows or unfollows it for themselves (the operation needs
 * `order:read`). Changing someone else's follow is an edit of the order and needs `order:write`;
 * an API key has no self, so it always needs it. An item also needs `item:read`; a task needs
 * `task:read`, and `task:write` for someone else (ADR 0117).
 */
export function checkFollower({ context, subjectType, userId }: CheckFollowerInput): Result<true> {
  const { permissions } = context;
  const read = SUBJECT_READ[subjectType];
  if (read && !hasPermission({ permissions, permission: read })) {
    return err({ error: appError({ code: "FORBIDDEN", message: `Missing permission ${read}` }) });
  }
  const self = context.actor.userId !== null && context.actor.userId === userId;
  const write = subjectType === "TASK" ? "task:write" : "order:write";
  if (self || hasPermission({ permissions, permission: write })) return ok({ value: true });
  const message = `Following for someone else needs ${write}`;
  return err({ error: appError({ code: "FORBIDDEN", message }) });
}
