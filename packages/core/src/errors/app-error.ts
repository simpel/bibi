export const APP_ERROR_CODES = [
  "NOT_FOUND",
  "FORBIDDEN",
  "UNAUTHENTICATED",
  "VALIDATION",
  "CONFLICT",
  "INTERNAL",
  /** A capability that is not configured or reachable right now (e.g. no AI model chosen). */
  "UNAVAILABLE",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

/** Field-level problem, e.g. from Zod. `path` is dot-joined (`rooms.0.name`). */
export type AppErrorIssue = { path: string; message: string };

export type AppErrorInput = {
  code: AppErrorCode;
  message: string;
  issues?: readonly AppErrorIssue[];
  cause?: unknown;
};

/** The single error type shared by core and every surface (UI, GraphQL, REST, MCP). */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly issues: readonly AppErrorIssue[];

  constructor({ code, message, issues = [], cause }: AppErrorInput) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
    this.issues = issues;
  }
}

/** Shorthand factory: `appError({ code: "NOT_FOUND", message: "Venue not found" })`. */
export function appError({ code, message, issues, cause }: AppErrorInput): AppError {
  return new AppError({ code, message, cause, ...(issues ? { issues } : {}) });
}
