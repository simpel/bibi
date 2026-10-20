import type { EntityType } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { EntityBase } from "./capability-kinds";

export type LoadTypeOfBaseInput = {
  context: Pick<OperationContext, "db">;
  entityTypeId: string;
  base: EntityBase;
};

/**
 * The active type a typed record (item, customer, contact) is created with. A type of another
 * base, an archived type or one in another organization is a `VALIDATION` issue on `entityTypeId`.
 */
export async function loadTypeOfBase({
  context,
  entityTypeId,
  base,
}: LoadTypeOfBaseInput): Promise<Result<EntityType>> {
  const type = await context.db.entityType.findFirst({ where: { id: entityTypeId, base } });
  if (type) return ok({ value: type });
  const message = `Unknown ${base.toLowerCase()} type`;
  return invalid({ message, issues: [{ path: "entityTypeId", message }] });
}
