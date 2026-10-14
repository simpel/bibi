import { GraphQLError, Kind } from "graphql";
import { builder } from "./builder";

function invalid({ what }: { what: string }): GraphQLError {
  return new GraphQLError(`Invalid ${what}`, { extensions: { code: "VALIDATION" } });
}

function toDate({ value }: { value: unknown }): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw invalid({ what: "DateTime" });
  return date;
}

builder.scalarType("DateTime", {
  description: "ISO 8601 timestamp, e.g. 2026-10-13T08:00:00.000Z",
  serialize: (value) => toDate({ value }).toISOString(),
  parseValue: (value) => toDate({ value }),
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.STRING) throw invalid({ what: "DateTime" });
    return toDate({ value: ast.value });
  },
});

builder.scalarType("JSON", {
  description: "Arbitrary JSON value",
  serialize: (value) => value,
  parseValue: (value) => value,
});
