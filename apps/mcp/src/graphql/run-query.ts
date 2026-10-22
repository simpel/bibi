import { appError, type EmbedFn, type ExecuteContext, err, ok, type Result } from "@bibi/core";
import { holdContext, RELAY_HEADER } from "./context-relay";
import { getGraphqlHandler } from "./get-handler";

export const MAX_RESULT_CHARS = 200_000;

export type GraphqlPayload = { data?: unknown; errors?: unknown[] };

export type RunGraphqlQueryInput = {
  query: string;
  variables?: Record<string, unknown> | undefined;
  operationName?: string | undefined;
  context: ExecuteContext;
  embed: EmbedFn;
};

/** Executes a (validated read-only) document with the caller's context via the GraphQL handler. */
export async function runGraphqlQuery({
  query,
  variables,
  operationName,
  context,
  embed,
}: RunGraphqlQueryInput): Promise<Result<GraphqlPayload>> {
  const held = holdContext({ context });
  try {
    const response = await getGraphqlHandler({ embed })(
      new Request("http://mcp.internal/graphql", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          [RELAY_HEADER]: held.id,
        },
        body: JSON.stringify({ query, variables, operationName }),
      }),
    );
    const body = await response.text();
    if (body.length > MAX_RESULT_CHARS) {
      const message = "Result is too large; select fewer fields or lower `limit`";
      return err({ error: appError({ code: "VALIDATION", message }) });
    }
    return ok({ value: JSON.parse(body) as GraphqlPayload });
  } finally {
    held.release();
  }
}
