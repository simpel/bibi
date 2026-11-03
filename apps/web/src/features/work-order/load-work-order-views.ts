import "server-only";
import {
  type FieldDefinitionDto,
  getWorkOrderDefinition,
  listEntityTypes,
  listWorkOrders,
  ok,
  type Result,
  type WorkOrderDefinitionDto,
  type WorkOrderDto,
} from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { WorkOrderFieldColumn } from "./ui/use-work-order-task-columns";

export type WorkOrderViewData = {
  workOrder: WorkOrderDto;
  /** The definition's name; null when the caller may not read the configuration. */
  name: string | null;
  /** The included fields in the definition's order, named when the item types are readable. */
  fields: WorkOrderFieldColumn[];
  /** Every version of the same ticket and definition, newest first. */
  versions: WorkOrderDto[];
};

const LIMIT = 100;

/** Field keys the rows carry, when the definition or the types cannot be read. */
const keysOf = ({ workOrder }: { workOrder: WorkOrderDto }): WorkOrderFieldColumn[] =>
  [
    ...new Set(
      workOrder.content.rows.flatMap((row) => (row.kind === "ITEM" ? Object.keys(row.values) : [])),
    ),
  ].map((key) => ({ key, name: key }));

type Lookups = {
  definitions: Map<string, WorkOrderDefinitionDto>;
  fields: Map<string, FieldDefinitionDto> | null;
};

/** Each distinct definition once, and the item types' fields once, for any number of versions. */
async function loadLookups({ workOrders }: { workOrders: WorkOrderDto[] }): Promise<Lookups> {
  const ids = [...new Set(workOrders.map((workOrder) => workOrder.workOrderDefinitionId))];
  const [found, types] = await Promise.all([
    Promise.all(
      ids.map((id) => runOperation({ operation: getWorkOrderDefinition, input: { id } })),
    ),
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
  ]);
  const definitions = new Map(
    found.flatMap((result) => (result.ok ? [[result.value.id, result.value]] : [])),
  );
  const fields = types.ok
    ? new Map(types.value.items.flatMap((type) => type.fields).map((field) => [field.id, field]))
    : null;
  return { definitions, fields };
}

type FieldsForInput = { workOrder: WorkOrderDto; lookups: Lookups };

function fieldsFor({ workOrder, lookups }: FieldsForInput): WorkOrderFieldColumn[] {
  const definition = lookups.definitions.get(workOrder.workOrderDefinitionId);
  const { fields } = lookups;
  if (!definition || !fields) return keysOf({ workOrder });
  return definition.fieldIds.flatMap((fieldId) => {
    const field = fields.get(fieldId);
    return field ? [{ key: field.key, name: field.name }] : [];
  });
}

/** The versions of the work order's ticket and definition, newest first. */
async function versionsOf({ workOrder }: { workOrder: WorkOrderDto }) {
  const { ticketId, workOrderDefinitionId } = workOrder;
  const input = { ticketId, workOrderDefinitionId, sort: "version" as const, limit: LIMIT };
  const result = await runOperation({ operation: listWorkOrders, input });
  return result.ok ? result.value.items : [workOrder];
}

/**
 * What `WorkOrderView` shows for each version: its definition's name and fields and its sibling
 * versions. Shared lookups load once, so Today renders many work orders without N+1 lookups.
 */
export async function loadWorkOrderViews({
  workOrders,
}: {
  workOrders: WorkOrderDto[];
}): Promise<Result<WorkOrderViewData[]>> {
  const [lookups, versions] = await Promise.all([
    loadLookups({ workOrders }),
    Promise.all(workOrders.map((workOrder) => versionsOf({ workOrder }))),
  ]);
  const views = workOrders.map((workOrder, index) => ({
    workOrder,
    name: lookups.definitions.get(workOrder.workOrderDefinitionId)?.name ?? null,
    fields: fieldsFor({ workOrder, lookups }),
    versions: versions[index] ?? [workOrder],
  }));
  return ok({ value: views });
}
