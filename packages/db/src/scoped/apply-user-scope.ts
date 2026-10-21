import { assertNoNestedWrites } from "./nested-writes";
import {
  CREATE_OPERATIONS,
  DELETE_OPERATIONS,
  READ_OPERATIONS,
  UPDATE_OPERATIONS,
} from "./operation-kinds";
import { ScopeViolationError } from "./scope-violation";
import { SYSTEM_ACTOR_ID } from "./system-actor";

type Args = Record<string, unknown>;

export type ApplyUserScopeInput = {
  model: string;
  operation: string;
  args: Args;
  /** The acting user: every row read or written must belong to them (ADR 0039). */
  actorId: string;
};

type ForceInput = { data: unknown; userId: string };

const forceOwner = ({ data, userId }: ForceInput): unknown =>
  Array.isArray(data)
    ? data.map((row: Args) => ({ ...row, userId }))
    : { ...(data as Args | undefined), userId };

/** The owner column is immutable: updates may not move a row to another user. */
const stripOwner = ({ data }: { data: unknown }): Args => {
  const { userId: _owner, ...rest } = (data as Args | undefined) ?? {};
  return rest;
};

/**
 * Rewrites Prisma args of a user-scoped model (`USER_SCOPED_MODELS`) so every query is pinned to
 * the acting user: `userId` is forced on creates and ANDed into every `where`. The system actor
 * has no user rows, so it is refused (fails closed).
 */
export function applyUserScope({ model, operation, args, actorId }: ApplyUserScopeInput): Args {
  if (actorId === SYSTEM_ACTOR_ID) {
    throw new ScopeViolationError({ model, operation, reason: "user-scoped model needs a user" });
  }
  for (const data of [args.data, args.create, args.update]) {
    assertNoNestedWrites({ model, operation, data });
  }
  if (CREATE_OPERATIONS.has(operation)) {
    return { ...args, data: forceOwner({ data: args.data, userId: actorId }) };
  }
  const where = { ...((args.where as Args | undefined) ?? {}), userId: actorId };
  if (operation === "upsert") {
    const create = forceOwner({ data: args.create, userId: actorId });
    return { ...args, where, create, update: stripOwner({ data: args.update }) };
  }
  if (UPDATE_OPERATIONS.has(operation)) {
    return { ...args, where, data: stripOwner({ data: args.data }) };
  }
  if (READ_OPERATIONS.has(operation) || DELETE_OPERATIONS.has(operation)) {
    return { ...args, where };
  }
  throw new ScopeViolationError({ model, operation, reason: "operation not supported" });
}
