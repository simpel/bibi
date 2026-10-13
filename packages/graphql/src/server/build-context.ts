import { type AfterCommitHook, type AnyOperation, type ExecuteContext, type Result } from "@okazi/core";
import type { GraphqlContext } from "../schema/context";
import { toGraphqlError } from "../schema/to-graphql-error";

export type ResolveContextInput = { headers: Headers };

/** Injected by the host; the real implementation comes from @okazi/auth. */
export type ResolveContext = (input: ResolveContextInput) => Promise<Result<ExecuteContext>>;

export type BuildContextInput = {
  request: Request;
  resolveContext: ResolveContext;
  operations: readonly AnyOperation[];
  afterCommit: readonly AfterCommitHook[];
};

/** Resolves the caller or fails the whole request (HTTP status from the AppError code). */
export async function buildContext({
  request,
  resolveContext,
  operations,
  afterCommit,
}: BuildContextInput): Promise<GraphqlContext> {
  const resolved = await resolveContext({ headers: request.headers });
  if (!resolved.ok) throw toGraphqlError({ error: resolved.error, withHttpStatus: true });
  return {
    core: resolved.value,
    afterCommit,
    operations: new Map(operations.map((operation) => [operation.name, operation])),
  };
}
