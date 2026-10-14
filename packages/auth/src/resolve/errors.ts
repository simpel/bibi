import { AppError, type Err, err } from "@okazi/core";

export type DenyInput = { message: string };

/** No (valid) credential: maps to HTTP 401 / MCP auth challenge. */
export function unauthenticated({ message }: DenyInput): Err<AppError> {
  return err({ error: new AppError({ code: "UNAUTHENTICATED", message }) });
}

/** Valid credential but no access to the requested organization/actor mode: HTTP 403. */
export function forbidden({ message }: DenyInput): Err<AppError> {
  return err({ error: new AppError({ code: "FORBIDDEN", message }) });
}
