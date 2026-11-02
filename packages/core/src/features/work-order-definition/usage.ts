import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

type Db = Pick<OperationContext, "db">;

/** What a work order definition can refer to. Archiving any of them is refused while it is used. */
export type WorkOrderReference =
  | { entityTypeId: string }
  | { fieldId: string }
  | { vocabularyId: string }
  | { responsibilityId: string };

/** An indexed `EXISTS` on the join rows (ADR 0056). */
function whereUsing({ reference }: { reference: WorkOrderReference }) {
  if ("entityTypeId" in reference) return { entityTypes: { some: reference } };
  if ("fieldId" in reference) return { fields: { some: reference } };
  if ("vocabularyId" in reference) return { vocabularies: { some: reference } };
  return reference;
}

export type CheckNotOnWorkOrdersInput = {
  context: Db;
  reference: WorkOrderReference;
  what: string;
};

/**
 * `CONFLICT` while an active work order definition includes the type, field or list or goes to the
 * responsibility (ADR 0026: data exists → CONFLICT). `what` names the record in the message.
 */
export async function checkNotOnWorkOrders({
  context,
  reference,
  what,
}: CheckNotOnWorkOrdersInput): Promise<Result<void>> {
  const workOrders = await context.db.workOrderDefinition.findMany({
    where: whereUsing({ reference }),
    select: { name: true },
    orderBy: { name: "asc" },
  });
  if (workOrders.length === 0) return ok({ value: undefined });
  const names = workOrders.map((workOrder) => workOrder.name).join(", ");
  return conflict({ message: `${what} is used by the work orders ${names}` });
}
