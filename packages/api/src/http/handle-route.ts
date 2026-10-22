import { type AfterCommitHook, type ExecuteContext, execute, type Result } from "@bibi/core";
import type { BuildInputInput } from "./build-input";
import { buildInput } from "./build-input";
import { errorResponse } from "./error-response";

export type HandleRouteInput = BuildInputInput & {
  context: Result<ExecuteContext>;
  afterCommit: readonly AfterCommitHook[];
};

/** Runs one matched route: merge input → `execute` (validate, authorize, handle) → response. */
export async function handleRoute({
  context,
  afterCommit,
  ...rest
}: HandleRouteInput): Promise<Response> {
  if (!context.ok) return errorResponse({ error: context.error });
  const input = await buildInput(rest);
  if (!input.ok) return errorResponse({ error: input.error });
  const { operation, route } = rest.compiled;
  const result = await execute({
    operation,
    input: input.value,
    context: context.value,
    afterCommit,
  });
  if (!result.ok) return errorResponse({ error: result.error });
  return Response.json(result.value, { status: route.successStatus });
}
