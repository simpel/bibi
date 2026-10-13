import type { AppError, AppErrorCode } from "./app-error";

const HTTP_STATUS: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAUTHENTICATED: 401,
  VALIDATION: 400,
  CONFLICT: 409,
  INTERNAL: 500,
};

export type ToHttpStatusInput = { error: AppError };

export function toHttpStatus({ error }: ToHttpStatusInput): number {
  return HTTP_STATUS[error.code];
}
