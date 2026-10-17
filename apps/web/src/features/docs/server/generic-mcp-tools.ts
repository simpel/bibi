import type { ReferenceEntry } from "../reference/types";

const READ = { group: "graphql", operation: "", readOnly: true, approval: false };

/** The MCP tools that are not generated from a core operation (see `apps/mcp/src/tools`). */
export const GENERIC_MCP_TOOLS: ReferenceEntry[] = [
  {
    ...READ,
    id: "graphql_schema",
    toolName: "graphql_schema",
    summary:
      "Returns the GraphQL schema (SDL) of the Okazi graph. Read it once, then use graphql_query to read related data in a single call.",
    permission: "authenticated",
    input: { type: "object", properties: {} },
    output: { type: "object", properties: { sdl: { type: "string" }, usage: { type: "string" } } },
  },
  {
    ...READ,
    id: "graphql_query",
    toolName: "graphql_query",
    summary:
      "Runs a read-only GraphQL query with your permissions and organization. Mutations and subscriptions are rejected.",
    permission: "authenticated",
    input: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "A GraphQL query document (no mutations)" },
        variables: { type: "object" },
        operationName: { type: "string" },
      },
    },
    output: { type: "object", properties: { data: {}, errors: { type: "array" } } },
  },
];
