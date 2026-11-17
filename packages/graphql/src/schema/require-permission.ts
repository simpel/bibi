import { checkPermission, type Permission } from "@bibi/core";
import type { GraphqlContext } from "./context";
import { toGraphqlError } from "./to-graphql-error";

export type RequirePermissionInput = { ctx: GraphqlContext; permission: Permission };

/** Core's gate (`checkPermission`), for graph reads that go straight to `ctx.core.db`. */
export function requirePermission({ ctx, permission }: RequirePermissionInput): void {
  const allowed = checkPermission({ context: ctx.core, permission });
  if (!allowed.ok) throw toGraphqlError({ error: allowed.error });
}
