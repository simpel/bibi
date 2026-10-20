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
import {
  findSheetDefinition,
  SHEET_DEFINITION_INCLUDE,
  toSheetDefinitionDto,
} from "./sheet-definition-rows";

export const listSheetDefinitions = defineOperation({
  name: "sheetDefinition.list",
  kind: "query",
  description:
    "List the organization's sheet definitions (e.g. Kitchen order, Brewing order): which item " +
    "types and fields each sheet includes, which lists' requirements it counts and which " +
    "responsibility it goes to.",
  input: SheetDefinitionListInputSchema,
  output: SheetDefinitionListOutputSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.sheetDefinition.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: SHEET_DEFINITION_INCLUDE,
      ...pageArgs(input),
    });
    const items = rows.map((row) => toSheetDefinitionDto({ row }));
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});

export const getSheetDefinition = defineOperation({
  name: "sheetDefinition.get",
  kind: "query",
  description: "Get one sheet definition by id.",
  input: SheetDefinitionIdInputSchema,
  output: SheetDefinitionSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const found = await findSheetDefinition({ context, id: input.id });
    return found ? ok({ value: found }) : notFound({ entity: "Sheet" });
  },
});
