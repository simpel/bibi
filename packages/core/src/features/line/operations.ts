import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { changeLineState } from "./change-state-operation";
import { followLinePhase } from "./follow-phase-operation";
import { LineIdInputSchema, LineListInputSchema, LineListOutputSchema, LineSchema } from "./schema";
import { loadLine, toLineDto } from "./to-line-dto";
import { archiveLine, createLine, updateLine } from "./write-operations";

export const listLines = defineOperation({
  name: "line.list",
  kind: "query",
  description:
    "List lines (the run schedule: sessions, breaks, meals, activities), earliest " +
    "first (lines on one item and start: the oldest held-since date first). Filter by ticket, " +
    "item, item state and a time window (from/to).",
  input: LineListInputSchema,
  output: LineListOutputSchema,
  permission: "line:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.line.findMany({
      where: {
        ...(input.ticketId ? { ticketId: input.ticketId } : {}),
        ...(input.itemId ? { itemId: input.itemId } : {}),
        ...(input.stateId ? { stateId: input.stateId } : {}),
        ...(input.from ? { endsAt: { gt: input.from } } : {}),
        ...(input.to ? { startsAt: { lt: input.to } } : {}),
      },
      // Overlapping holders of one item: the oldest `heldAt` first (ADR 0044, no rank or queue).
      orderBy: [{ startsAt: "asc" }, { heldAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toLineDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getLine = defineOperation({
  name: "line.get",
  kind: "query",
  description: "Get one line by id, with the type's field values.",
  input: LineIdInputSchema,
  output: LineSchema,
  permission: "line:read",
  handler: async ({ input, context }) => {
    const line = await loadLine({ context, id: input.id });
    return line ? ok({ value: line }) : notFound({ entity: "Line" });
  },
});

export const lineOperations = [
  listLines,
  getLine,
  createLine,
  updateLine,
  archiveLine,
  changeLineState,
  followLinePhase,
];
