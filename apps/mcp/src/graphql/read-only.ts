import { appError, err, ok, type Result } from "@okazi/core";
import { GraphQLError, Kind, parse } from "graphql";

export const MAX_QUERY_LENGTH = 10_000;

export type AssertReadOnlyInput = { query: string };

/** Rejects syntax errors and any operation that is not a plain `query` (mutation, subscription). */
export function assertReadOnly({ query }: AssertReadOnlyInput): Result<true> {
  if (query.length > MAX_QUERY_LENGTH) {
    const message = `Query is too long (max ${MAX_QUERY_LENGTH} characters)`;
    return err({ error: appError({ code: "VALIDATION", message }) });
  }
  try {
    for (const definition of parse(query).definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION && definition.operation !== "query") {
        const message = `graphql_query is read-only: ${definition.operation} is not allowed. Use the curated tools for changes.`;
        return err({ error: appError({ code: "FORBIDDEN", message }) });
      }
    }
    return ok({ value: true });
  } catch (error) {
    const message = error instanceof GraphQLError ? error.message : "Invalid GraphQL document";
    return err({ error: appError({ code: "VALIDATION", message }) });
  }
}
