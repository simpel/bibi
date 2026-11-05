import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  RunSheetDefinitionIdInputSchema,
  RunSheetDefinitionListInputSchema,
  RunSheetDefinitionListOutputSchema,
  RunSheetDefinitionSchema,
} from "./schema";
import {
  findRunSheetDefinition,
  toRunSheetDefinitionDto,
  RUN_SHEET_DEFINITION_INCLUDE,
} from "./run-sheet-definition-rows";

export const listRunSheetDefinitions = defineOperation({
  name: "runSheetDefinition.list",
  kind: "query",
  description:
    "List the organization's run sheet definitions (e.g. Kitchen order, Brewing order): which item " +
    "types and fields each run sheet includes, which lists' requirements it counts and which " +
    "responsibility it goes to.",
  input: RunSheetDefinitionListInputSchema,
  output: RunSheetDefinitionListOutputSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.runSheetDefinition.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: RUN_SHEET_DEFINITION_INCLUDE,
      ...pageArgs(input),
    });
    const items = rows.map((row) => toRunSheetDefinitionDto({ row }));
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});

export const getRunSheetDefinition = defineOperation({
  name: "runSheetDefinition.get",
  kind: "query",
  description: "Get one run sheet definition by id.",
  input: RunSheetDefinitionIdInputSchema,
  output: RunSheetDefinitionSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const found = await findRunSheetDefinition({ context, id: input.id });
    return found ? ok({ value: found }) : notFound({ entity: "RunSheet" });
  },
});
