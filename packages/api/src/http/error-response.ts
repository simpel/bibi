import { type AppError, toHttpStatus } from "@bibi/core";

export type ErrorResponseInput = { error: AppError };

/** Consistent error envelope for every failure: `{ error: { code, message, issues } }`. */
export function errorResponse({ error }: ErrorResponseInput): Response {
  const body = { error: { code: error.code, message: error.message, issues: error.issues } };
  return Response.json(body, { status: toHttpStatus({ error }) });
}
