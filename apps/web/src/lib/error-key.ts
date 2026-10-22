import type { AppErrorCode } from "@bibi/core";

/** Keys of the `errors` message namespace that an AppError code can map to. */
export type ErrorKey =
  | "generic"
  | "notFound"
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "conflict"
  | "network"
  | "unavailable";

const KEY_BY_CODE: Record<AppErrorCode, ErrorKey> = {
  NOT_FOUND: "notFound",
  FORBIDDEN: "forbidden",
  UNAUTHENTICATED: "unauthorized",
  VALIDATION: "validation",
  CONFLICT: "conflict",
  INTERNAL: "generic",
  UNAVAILABLE: "unavailable",
};

export type ErrorKeyInput = { code: AppErrorCode };

/** The single AppError code → `errors.*` i18n key mapping used by every UI surface. */
export function errorKeyForCode({ code }: ErrorKeyInput): ErrorKey {
  return KEY_BY_CODE[code];
}

export type ParseAppErrorCodeInput = { value: unknown };

/** An AppError code read from untrusted JSON (e.g. an API error body), or null. */
export function parseAppErrorCode({ value }: ParseAppErrorCodeInput): AppErrorCode | null {
  return typeof value === "string" && Object.hasOwn(KEY_BY_CODE, value)
    ? (value as AppErrorCode)
    : null;
}
