import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { checkReadable } from "../ticket/ticket-rules";
import { changeLineState } from "./change-state-operation";
import { chooseOptions } from "./choose-options";
import {
  LineChooseOptionsInputSchema,
  LineChooseOptionsOutputSchema,
} from "./choose-options-schema";
import { expandLineBundle } from "./expand-operation";
import { followLinePhase } from "./follow-phase-operation";
import { LineListInputSchema, LineListOutputSchema } from "./list-schema";
import { LineIdInputSchema, LineSchema } from "./schema";
import { byHeldSince } from "./state-history";
import { LINE_INCLUDE, loadLine, toLineRecord } from "./to-line-record";
import { withEffective, withEffectiveOne } from "./with-effective";
import { archiveLine, createLine, updateLine } from "./write-operations";

export const listLines = defineOperation({
  name: "line.list",
  kind: "query",
  description:
    "List lines (the run schedule: sessions, breaks, meals, activities), earliest " +
    "first (lines on one item and start: the oldest held-since date first). Filter by ticket, " +
    "item, item state, bundle line (its part lines) and a time window (from/to).",
  input: LineListInputSchema,
  output: LineListOutputSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.line.findMany({
      where: {
        ...(input.ticketId ? { ticketId: input.ticketId } : {}),
        ...(input.itemId ? { itemId: input.itemId } : {}),
        ...(input.stateId ? { stateId: input.stateId } : {}),
        ...(input.parentLineId ? { parentLineId: input.parentLineId } : {}),
        ...(input.from ? { endsAt: { gt: input.from } } : {}),
        ...(input.to ? { startsAt: { lt: input.to } } : {}),
      },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
      include: LINE_INCLUDE,
    });
    const page = paginate({ rows, limit: input.limit });
    // Overlapping holders of one item: the oldest "held since" first (ADR 0044, no rank or
    // queue). It is the newest state change (ADR 0054), so lines that start together are
    // ordered by it within the page.
    const records = byHeldSince({ rows: page.items }).map((row) => toLineRecord({ row }));
    const items = await withEffective({ context, lines: records });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getLine = defineOperation({
  name: "line.get",
  kind: "query",
  description:
    "Get one line by id, with the type's field values and its effective quantity, price, " +
    "discount and VAT (each with its source: the line's own override or inherited).",
  input: LineIdInputSchema,
  output: LineSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const line = await loadLine({ context, id: input.id });
    if (!line) return notFound({ entity: "Line" });
    return ok({ value: await withEffectiveOne({ context, line }) });
  },
});

export const chooseLineOptions = defineOperation({
  name: "line.chooseOptions",
  kind: "command",
  description:
    "Choose the customisation options of a line whose item has customisation groups (ADR " +
    "0059). Replaces the line's choices: each chosen option becomes an option line under the " +
    "line (same time, quantity and type) and a dropped one is removed. Each group needs between " +
    "its minPick and maxPick options; a group with minPick 0 can be skipped, and opting out is " +
    "choosing the other option. The option's price effect decides the totals: INCLUDED does not " +
    "count, EXTRA counts at its own price, REPLACES counts instead of the line. A chosen " +
    "option's own needs apply as for any line. Needs item:read (the options are items).",
  input: LineChooseOptionsInputSchema,
  output: LineChooseOptionsOutputSchema,
  permission: "program:write",
  handler: async ({ input, context }) => {
    const readable = checkReadable({ context, permission: "item:read", path: "optionItemIds" });
    if (!readable.ok) return readable;
    const lines = await chooseOptions({ context, input });
    if (!lines.ok) return lines;
    return ok({ value: { items: await withEffective({ context, lines: lines.value }) } });
  },
});

export const lineOperations = [
  listLines,
  getLine,
  createLine,
  expandLineBundle,
  chooseLineOptions,
  updateLine,
  archiveLine,
  changeLineState,
  followLinePhase,
];
