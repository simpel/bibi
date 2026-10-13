import { type AppError, toGraphqlExtensions } from "@okazi/core";
import { GraphQLError } from "graphql";

export type ToGraphqlErrorInput = { error: AppError; withHttpStatus?: boolean };

/** The single AppError → GraphQLError mapping; INTERNAL messages are not leaked. */
export function toGraphqlError({ error, withHttpStatus = false }: ToGraphqlErrorInput): GraphQLError {
  const extensions = toGraphqlExtensions({ error });
  const message = error.code === "INTERNAL" ? "Internal error" : error.message;
  return new GraphQLError(message, {
    extensions: withHttpStatus ? { ...extensions, http: { status: extensions.httpStatus } } : { ...extensions },
  });
}
