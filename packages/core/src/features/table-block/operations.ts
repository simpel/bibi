import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import {
  TableBlockCreateInputSchema,
  TableBlockCreateOutputSchema,
  type TableBlockDto,
  TableBlockIdInputSchema,
  TableBlockListInputSchema,
  TableBlockListOutputSchema,
  TableBlockSchema,
} from "./schema";

type Ctx = { context: Pick<OperationContext, "db"> };

const SELECT = {
  id: true,
  elementId: true,
  kind: true,
  startsAt: true,
  endsAt: true,
  note: true,
  element: { select: { label: true } },
} as const;

type Row = {
  id: string;
  elementId: string;
  kind: string;
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  element: { label: string | null };
};

const toDto = ({ row }: { row: Row }): TableBlockDto => ({
  ...{ id: row.id, elementId: row.elementId, label: row.element.label },
  kind: row.kind === "ONLINE_ONLY" ? "ONLINE_ONLY" : "BLOCK",
  ...{ startsAt: row.startsAt, endsAt: row.endsAt, note: row.note },
});

const BLOCK_KINDS = { in: ["BLOCK" as const, "ONLINE_ONLY" as const] };

export const listTableBlocks = defineOperation({
  name: "tableBlock.list",
  kind: "query",
  description:
    "Tables staff held back in a period (ADR 0119): blocked for everyone or kept from guests.",
  input: TableBlockListInputSchema,
  output: TableBlockListOutputSchema,
  permission: "reservation:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.tableHold.findMany({
      where: {
        kind: BLOCK_KINDS,
        startsAt: { lt: input.to },
        endsAt: { gt: input.from },
        ...(input.layoutId ? { element: { setupLayoutId: input.layoutId } } : {}),
      },
      select: SELECT,
      orderBy: { startsAt: "asc" },
    });
    return ok({ value: { items: rows.map((row) => toDto({ row })) } });
  },
});

/** The tables' rooms: every id must be a seated piece of a layout. */
async function roomsOf({ context, elementIds }: Ctx & { elementIds: readonly string[] }) {
  const pieces = await context.db.floorElement.findMany({
    where: { id: { in: [...elementIds] }, setupLayoutId: { not: null } },
    select: {
      id: true,
      setupLayout: { select: { itemId: true } },
      kind: { select: { shape: true, fixed: true } },
    },
  });
  const tables = pieces.filter(
    (p) => !p.kind.fixed && (p.kind.shape === "ROUND" || p.kind.shape === "RECT"),
  );
  return {
    found: tables.length,
    rooms: [...new Set(tables.flatMap((p) => (p.setupLayout ? [p.setupLayout.itemId] : [])))],
  };
}

export const createTableBlock = defineOperation({
  name: "tableBlock.create",
  kind: "command",
  description:
    "Hold tables back for a period, e.g. the window tables on Friday evening for walk-ins " +
    "(ONLINE_ONLY: staff may still book them) or a broken table (BLOCK). A table already " +
    "booked or blocked then is CONFLICT.",
  input: TableBlockCreateInputSchema,
  output: TableBlockCreateOutputSchema,
  permission: "reservation:write",
  handler: async ({ input, context }) => {
    const ids = [...new Set(input.elementIds)];
    const { found, rooms } = await roomsOf({ context, elementIds: ids });
    if (found !== ids.length) {
      const message = "Only tables (seated pieces of a layout) can be blocked";
      return invalid({ message, issues: [{ path: "elementIds", message }] });
    }
    for (const roomItemId of rooms) await context.db.$advisoryLock({ key: `room:${roomItemId}` });
    const span = { startsAt: input.startsAt, endsAt: input.endsAt };
    const taken = await context.db.tableHold.count({
      where: {
        elementId: { in: ids },
        startsAt: { lt: span.endsAt },
        endsAt: { gt: span.startsAt },
      },
    });
    if (taken > 0)
      return conflict({ message: "A table is already booked or blocked in that period" });
    await context.db.tableHold.createMany({
      data: ids.map((elementId) => ({
        ...{ ...span, elementId, kind: input.kind, note: input.note },
        organizationId: context.organizationId,
      })),
    });
    const rows = await context.db.tableHold.findMany({
      where: { elementId: { in: ids }, kind: input.kind, ...span },
      select: SELECT,
    });
    const items = rows.map((row) => toDto({ row }));
    for (const item of items) context.recordChange({ entityId: item.id, after: item });
    return ok({ value: { items } });
  },
});

export const deleteTableBlock = defineOperation({
  name: "tableBlock.delete",
  kind: "command",
  description: "Release a table block: the table can be booked again in that period.",
  input: TableBlockIdInputSchema,
  output: TableBlockSchema,
  permission: "reservation:write",
  handler: async ({ input, context }) => {
    const row = await context.db.tableHold.findFirst({
      where: { id: input.id, kind: BLOCK_KINDS },
      select: SELECT,
    });
    if (!row) return notFound({ entity: "Table block" });
    await context.db.tableHold.update({ where: { id: input.id }, data: { status: "ARCHIVED" } });
    const before = toDto({ row });
    context.recordChange({ entityId: input.id, before });
    return ok({ value: before });
  },
});

export const tableBlockOperations = [listTableBlocks, createTableBlock, deleteTableBlock];
