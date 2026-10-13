import type { AppError, AppErrorIssue } from "./app-error";
import { toHttpStatus } from "./to-http-status";

export type GraphqlErrorExtensions = {
  code: AppError["code"];
  httpStatus: number;
  issues: readonly AppErrorIssue[];
};

export type ToGraphqlExtensionsInput = { error: AppError };

/** Value for `GraphQLError.extensions`; INTERNAL details are never exposed. */
export function toGraphqlExtensions({ error }: ToGraphqlExtensionsInput): GraphqlErrorExtensions {
  return { code: error.code, httpStatus: toHttpStatus({ error }), issues: error.issues };
}
