import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkReadable } from "../ticket/ticket-rules";

export type CheckLinesReadableInput = {
  context: Pick<OperationContext, "permissions">;
  /** The input field that names the ticket or quote. */
  path: string;
};

/**
 * Freezing a ticket's lines as order lines copies line data (`program`) and item data (tags,
 * price unit), so it needs `program:read` and `item:read` at copy time (ADR 0050, feature scope).
 * Checked before anything is read.
 */
export function checkLinesReadable({ context, path }: CheckLinesReadableInput): Result<true> {
  for (const permission of ["program:read", "item:read"] as const) {
    const readable = checkReadable({ context, permission, path });
    if (!readable.ok) return readable;
  }
  return ok({ value: true });
}
