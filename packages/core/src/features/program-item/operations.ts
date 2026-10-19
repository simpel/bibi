import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { changeLineState } from "./change-state-operation";
import { followLinePhase } from "./follow-phase-operation";
import {
  ProgramItemIdInputSchema,
  ProgramItemListInputSchema,
  ProgramItemListOutputSchema,
  ProgramItemSchema,
} from "./schema";
import { loadProgramItem, toProgramItemDto } from "./to-program-item-dto";
import { archiveProgramItem, createProgramItem, updateProgramItem } from "./write-operations";

export const listProgramItems = defineOperation({
  name: "programItem.list",
  kind: "query",
  description:
    "List program items (the run schedule: sessions, breaks, meals, activities), earliest " +
    "first (lines on one item and start: the oldest held-since date first). Filter by ticket, " +
    "item, item state and a time window (from/to).",
  input: ProgramItemListInputSchema,
  output: ProgramItemListOutputSchema,
  permission: "program:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.programItem.findMany({
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
    const items = page.items.map((row) => toProgramItemDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getProgramItem = defineOperation({
  name: "programItem.get",
  kind: "query",
  description: "Get one program item by id, with the type's field values.",
  input: ProgramItemIdInputSchema,
  output: ProgramItemSchema,
  permission: "program:view",
  handler: async ({ input, context }) => {
    const programItem = await loadProgramItem({ context, id: input.id });
    return programItem ? ok({ value: programItem }) : notFound({ entity: "Program item" });
  },
});

export const programItemOperations = [
  listProgramItems,
  getProgramItem,
  createProgramItem,
  updateProgramItem,
  archiveProgramItem,
  changeLineState,
  followLinePhase,
];
