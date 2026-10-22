import { type AppError, toHttpStatus } from "@bibi/core";

export type ErrorResponseInput = { error: AppError };

/** JSON error body `{ error: { code, message, issues } }` with the shared AppError → HTTP map. */
export function errorResponse({ error }: ErrorResponseInput): Response {
  const status = toHttpStatus({ error });
  const message = error.code === "INTERNAL" ? "Internal error" : error.message;
  const body = { error: { code: error.code, message, issues: error.issues } };
  return Response.json(body, { status });
}
