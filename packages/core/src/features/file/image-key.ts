import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

export type CheckImageKeyInput = {
  context: Pick<OperationContext, "actor">;
  /** The key the command sets; null clears the image, undefined leaves it. */
  key: string | null | undefined;
  /** The record's key now; keeping it needs no new upload. */
  current?: string | null | undefined;
  path: string;
};

/**
 * Key ownership (ADR 0063): a record's image is a key the caller uploaded with `file.upload`, or
 * the one it already has. Anything else, and any new key from a caller without a user, is refused.
 */
export function checkImageKey({ context, key, current, path }: CheckImageKeyInput): Result<true> {
  if (key == null || key === current) return ok({ value: true });
  const userId = context.actor.userId;
  if (userId && key.startsWith(`${userId}/`)) return ok({ value: true });
  const message = "Upload the image with file.upload first";
  return invalid({ message: "Unknown image", issues: [{ path, message }] });
}
