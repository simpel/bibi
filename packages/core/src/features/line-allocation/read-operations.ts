import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  LineAllocationIdInputSchema,
  LineAllocationListInputSchema,
  LineAllocationListOutputSchema,
  LineAllocationSchema,
} from "./schema";

export const listLineAllocations = defineOperation({
  name: "lineAllocation.list",
  kind: "query",
  description:
    "List a line's allocations (ADR 0059): one per slot of each demand of the line's item and " +
    "of the units allocated to it (parentAllocationId, e.g. a projector's technician), with the " +
    "unit that fills it (null while unfilled). Only ids: read the demand with itemDemand.get " +
    "and the unit with item.get.",
  input: LineAllocationListInputSchema,
  output: LineAllocationListOutputSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const line = await context.db.line.findFirst({ where: { id: input.lineId } });
    if (!line) return notFound({ entity: "Line" });
    const rows = await context.db.lineAllocation.findMany({
      where: { lineId: input.lineId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getLineAllocation = defineOperation({
  name: "lineAllocation.get",
  kind: "query",
  description: "Get one allocation (a demand's slot on a line and its unit) by id.",
  input: LineAllocationIdInputSchema,
  output: LineAllocationSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const row = await context.db.lineAllocation.findFirst({ where: { id: input.id } });
    return row ? ok({ value: row }) : notFound({ entity: "Allocation" });
  },
});
