import "server-only";
import {
  getWorkOrder,
  getWorkOrderDefinition,
  listEntityTypes,
  ok,
  type Result,
  type WorkOrderDto,
} from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { WorkOrderFieldColumn } from "./ui/use-work-order-task-columns";

export type WorkOrderDocumentData = {
  workOrder: WorkOrderDto;
  /** The definition's name; null when the caller may not read the configuration. */
  name: string | null;
  /** The included fields in the definition's order, named when the item types are readable. */
  fields: WorkOrderFieldColumn[];
};

const LIMIT = 100;

/** Field keys the rows carry, when the definition or the types cannot be read. */
const keysOf = ({ workOrder }: { workOrder: WorkOrderDto }): WorkOrderFieldColumn[] =>
  [
    ...new Set(
      workOrder.content.rows.flatMap((row) => (row.kind === "ITEM" ? Object.keys(row.values) : [])),
    ),
  ].map((key) => ({ key, name: key }));

/** One work order version with its definition's name and field names, for the document page. */
export async function loadWorkOrderDocument({
  id,
}: {
  id: string;
}): Promise<Result<WorkOrderDocumentData>> {
  const found = await runOperation({ operation: getWorkOrder, input: { id } });
  if (!found.ok) return found;
  const workOrder = found.value;
  const [definition, types] = await Promise.all([
    runOperation({
      operation: getWorkOrderDefinition,
      input: { id: workOrder.workOrderDefinitionId },
    }),
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
  ]);
  const name = definition.ok ? definition.value.name : null;
  if (!definition.ok || !types.ok)
    return ok({ value: { workOrder, name, fields: keysOf({ workOrder }) } });
  const byId = new Map(
    types.value.items.flatMap((type) => type.fields).map((field) => [field.id, field]),
  );
  const fields = definition.value.fieldIds.flatMap((fieldId) => {
    const field = byId.get(fieldId);
    return field ? [{ key: field.key, name: field.name }] : [];
  });
  return ok({ value: { workOrder, name, fields } });
}
