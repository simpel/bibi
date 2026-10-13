import type { AppErrorCode } from "@okazi/core";

/** Keys of the `errors` message namespace that an AppError code can map to. */
export type ErrorKey =
  | "generic"
  | "notFound"
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "conflict";

const KEY_BY_CODE: Record<AppErrorCode, ErrorKey> = {
  NOT_FOUND: "notFound",
  FORBIDDEN: "forbidden",
  UNAUTHENTICATED: "unauthorized",
  VALIDATION: "validation",
  CONFLICT: "conflict",
  INTERNAL: "generic",
};

export type ErrorKeyInput = { code: AppErrorCode };

/** The single AppError code → `errors.*` i18n key mapping used by every UI surface. */
export function errorKeyForCode({ code }: ErrorKeyInput): ErrorKey {
  return KEY_BY_CODE[code];
}
