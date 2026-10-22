import type { EntityType } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

export type CheckExpiryStateInput = {
  context: Pick<OperationContext, "db">;
  type: EntityType;
  /** `undefined` keeps the current one, `null` clears it. */
  expiryStateId: string | null | undefined;
};

/**
 * A type's expiry state (ADR 0044) is an active state of the same item type. Only item types have
 * states; anything else is a `VALIDATION` issue on `expiryStateId`.
 */
export async function checkExpiryState({
  context,
  type,
  expiryStateId,
}: CheckExpiryStateInput): Promise<Result<true>> {
  if (!expiryStateId) return ok({ value: true });
  const found =
    type.base === "ITEM"
      ? await context.db.itemState.count({ where: { id: expiryStateId, entityTypeId: type.id } })
      : 0;
  if (found > 0) return ok({ value: true });
  const message = "Choose an active state of this item type";
  return invalid({ message, issues: [{ path: "expiryStateId", message }] });
}
