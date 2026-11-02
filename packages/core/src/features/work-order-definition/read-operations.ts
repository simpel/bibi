import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  WorkOrderDefinitionIdInputSchema,
  WorkOrderDefinitionListInputSchema,
  WorkOrderDefinitionListOutputSchema,
  WorkOrderDefinitionSchema,
} from "./schema";
import {
  findWorkOrderDefinition,
  toWorkOrderDefinitionDto,
  WORK_ORDER_DEFINITION_INCLUDE,
} from "./work-order-definition-rows";

export const listWorkOrderDefinitions = defineOperation({
  name: "workOrderDefinition.list",
  kind: "query",
  description:
    "List the organization's work order definitions (e.g. Kitchen order, Brewing order): which item " +
    "types and fields each work order includes, which lists' requirements it counts and which " +
    "responsibility it goes to.",
  input: WorkOrderDefinitionListInputSchema,
  output: WorkOrderDefinitionListOutputSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.workOrderDefinition.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: WORK_ORDER_DEFINITION_INCLUDE,
      ...pageArgs(input),
    });
    const items = rows.map((row) => toWorkOrderDefinitionDto({ row }));
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});

export const getWorkOrderDefinition = defineOperation({
  name: "workOrderDefinition.get",
  kind: "query",
  description: "Get one work order definition by id.",
  input: WorkOrderDefinitionIdInputSchema,
  output: WorkOrderDefinitionSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const found = await findWorkOrderDefinition({ context, id: input.id });
    return found ? ok({ value: found }) : notFound({ entity: "WorkOrder" });
  },
});
