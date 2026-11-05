import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { hasPermission, type Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";

/** The features a run sheet copies its rows from: the order, its program items and their items. */
const SOURCE_PERMISSIONS: readonly Permission[] = ["order:read", "program:read", "item:read"];

export type CheckSourcesReadableInput = { context: Pick<OperationContext, "permissions"> };

/**
 * A run sheet is a snapshot of other features' data, so generating it needs `view` on each of them
 * at copy time (ADR 0050, "Snapshots need view at copy time"). Checked before anything is read.
 */
export function checkSourcesReadable({ context }: CheckSourcesReadableInput): Result<true> {
  const { permissions } = context;
  const missing = SOURCE_PERMISSIONS.filter(
    (permission) => !hasPermission({ permissions, permission }),
  );
  if (missing.length === 0) return ok({ value: true });
  const message =
    "Generating a run sheet copies the order, its program and its items; it needs " +
    `${SOURCE_PERMISSIONS.join(", ")} (missing ${missing.join(", ")})`;
  return err({ error: new AppError({ code: "FORBIDDEN", message }) });
}
