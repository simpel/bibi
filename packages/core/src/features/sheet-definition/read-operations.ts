import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  SheetDefinitionIdInputSchema,
  SheetDefinitionListInputSchema,
  SheetDefinitionListOutputSchema,
  SheetDefinitionSchema,
} from "./schema";

export const listSheetDefinitions = defineOperation({
  name: "sheetDefinition.list",
  kind: "query",
  description:
    "List the organization's sheet definitions (e.g. Kitchen order, Brewing order): which item " +
    "types and fields each sheet includes, which lists' requirements it counts and which role " +
    "it goes to.",
  input: SheetDefinitionListInputSchema,
  output: SheetDefinitionListOutputSchema,
  permission: "template:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.sheetDefinition.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getSheetDefinition = defineOperation({
  name: "sheetDefinition.get",
  kind: "query",
  description: "Get one sheet definition by id.",
  input: SheetDefinitionIdInputSchema,
  output: SheetDefinitionSchema,
  permission: "template:view",
  handler: async ({ input, context }) => {
    const row = await context.db.sheetDefinition.findFirst({ where: { id: input.id } });
    return row ? ok({ value: row }) : notFound({ entity: "Sheet" });
  },
});
