import { appError, type EmbedFn } from "@okazi/core";
import { printSchemaSdl } from "@okazi/graphql";
import { z } from "zod";
import { assertReadOnly, MAX_QUERY_LENGTH } from "../graphql/read-only";
import { runGraphqlQuery } from "../graphql/run-query";
import { toJsonSchema } from "./json-schema";
import { errorResult, successResult } from "./results";
import type { McpTool, RunToolInput } from "./types";

const READ_ONLY = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };

export const GraphqlQueryInputSchema = z.object({
  query: z.string().min(1).max(MAX_QUERY_LENGTH).describe("A GraphQL query document (no mutations)"),
  variables: z.record(z.string(), z.unknown()).optional(),
  operationName: z.string().optional(),
});

export function createGraphqlSchemaTool(): McpTool {
  return {
    name: "graphql_schema",
    description:
      "Returns the GraphQL schema (SDL) of the Okazi graph. Read it once, then use graphql_query " +
      "to read related data (e.g. venues with their rooms) in a single call.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "object", properties: { sdl: { type: "string" }, usage: { type: "string" } } },
    annotations: { title: "graphql_schema", ...READ_ONLY },
    async run() {
      const usage = "Call graphql_query({ query, variables }). Queries only; scoped to your organization.";
      return successResult({ value: { sdl: printSchemaSdl(), usage } });
    },
  };
}

export type GraphqlQueryToolInput = { embed: EmbedFn };

export function createGraphqlQueryTool({ embed }: GraphqlQueryToolInput): McpTool {
  return {
    name: "graphql_query",
    description:
      "Runs a read-only GraphQL query against the Okazi graph with your permissions and " +
      "organization. Mutations and subscriptions are rejected; use the curated tools to change data.",
    inputSchema: toJsonSchema({ schema: GraphqlQueryInputSchema, io: "input" }),
    outputSchema: {
      type: "object",
      properties: { data: {}, errors: { type: "array", items: { type: "object" } } },
    },
    annotations: { title: "graphql_query", ...READ_ONLY },
    async run({ args, context }: RunToolInput) {
      const parsed = GraphqlQueryInputSchema.safeParse(args);
      if (!parsed.success) {
        return errorResult({ error: appError({ code: "VALIDATION", message: "Invalid query input" }) });
      }
      const readOnly = assertReadOnly({ query: parsed.data.query });
      if (!readOnly.ok) return errorResult({ error: readOnly.error });
      const result = await runGraphqlQuery({ ...parsed.data, context, embed });
      if (!result.ok) return errorResult({ error: result.error });
      const failed = !result.value.data && Boolean(result.value.errors?.length);
      return failed ? { ...successResult({ value: result.value }), isError: true } : successResult({ value: result.value });
    },
  };
}
