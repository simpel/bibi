import { appError, hasPermission, type Permission } from "@okazi/core";
import type { GraphqlContext } from "./context";
import { toGraphqlError } from "./to-graphql-error";

export type RequirePermissionInput = { ctx: GraphqlContext; permission: Permission };

/** Same rule as core `authorize`, for graph reads that go straight to `ctx.core.db`. */
export function requirePermission({ ctx, permission }: RequirePermissionInput): void {
  const { actor, permissions } = ctx.core;
  if (actor.type === "system") return;
  if (!actor.userId) {
    throw toGraphqlError({
      error: appError({ code: "UNAUTHENTICATED", message: "Sign in required" }),
    });
  }
  if (!hasPermission({ permissions, permission })) {
    const message = `Missing permission ${permission}`;
    throw toGraphqlError({ error: appError({ code: "FORBIDDEN", message }) });
  }
}
