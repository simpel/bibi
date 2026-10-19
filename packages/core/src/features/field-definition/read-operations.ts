import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  FieldDefinitionIdInputSchema,
  FieldDefinitionListInputSchema,
  FieldDefinitionListOutputSchema,
  FieldDefinitionSchema,
} from "./schema";

export const listFieldDefinitions = defineOperation({
  name: "fieldDefinition.list",
  kind: "query",
  description:
    "List the organization's own fields, optionally for one type, in display order. " +
    "Values of these fields are stored in an entity's `fields` JSON under each field's `key`.",
  input: FieldDefinitionListInputSchema,
  output: FieldDefinitionListOutputSchema,
  permission: "configuration:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.fieldDefinition.findMany({
      where: input.entityTypeId ? { entityTypeId: input.entityTypeId } : {},
      orderBy: [{ entityTypeId: "asc" }, { position: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getFieldDefinition = defineOperation({
  name: "fieldDefinition.get",
  kind: "query",
  description: "Get one field definition by id.",
  input: FieldDefinitionIdInputSchema,
  output: FieldDefinitionSchema,
  permission: "configuration:view",
  handler: async ({ input, context }) => {
    const field = await context.db.fieldDefinition.findFirst({ where: { id: input.id } });
    return field ? ok({ value: field }) : notFound({ entity: "Field" });
  },
});
