import { lexicographicSortSchema, printSchema } from "graphql";
import "../features/venue/graphql";
import "../features/room/graphql";
import "../features/conversation/graphql";
import "../features/message/graphql";
import "../features/skill/graphql";
import "./scalars";
import "./search";
import { builder } from "./builder";
import { exposedOperationNames } from "./exposed-operations";

/** The executable schema. Importing this module registers every feature. */
export const schema = builder.toSchema({});

/** SDL for MCP `graphql_schema` and docs; deterministic order. */
export function printSchemaSdl(): string {
  return printSchema(lexicographicSortSchema(schema));
}

/** Operation names (`venue.create`, `search`, ...) exposed as GraphQL queries or mutations. */
export function listGraphqlOperationNames(): string[] {
  return exposedOperationNames();
}
