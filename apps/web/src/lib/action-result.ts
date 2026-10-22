import type { AppErrorCode, AppErrorIssue } from "@bibi/core";

/** Serializable error crossing the server-action boundary (AppError itself cannot). */
export type ActionError = {
  code: AppErrorCode;
  message: string;
  issues: readonly AppErrorIssue[];
};

/** Serializable counterpart of core `Result` returned by every server action. */
export type ActionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ActionError };
