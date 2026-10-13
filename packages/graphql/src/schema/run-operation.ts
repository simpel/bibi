import { type AnyOperation, execute } from "@okazi/core";
import type { GraphqlContext } from "./context";
import { toGraphqlError } from "./to-graphql-error";

export type RunOperationInput = {
  operation: AnyOperation;
  input: unknown;
  ctx: GraphqlContext;
};

/** Parity mechanism: every GraphQL resolver that touches data goes through core `execute`. */
export async function runOperation({ operation, input, ctx }: RunOperationInput): Promise<unknown> {
  const runtime = ctx.operations.get(operation.name) ?? operation;
  const result = await execute({
    operation: runtime,
    input,
    context: ctx.core,
    afterCommit: ctx.afterCommit,
  });
  if (!result.ok) throw toGraphqlError({ error: result.error });
  return result.value;
}
