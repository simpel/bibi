import type { OperationContext } from "../../operations/types";
import { visibleTo } from "../../shared/visible-to";
import {
  deriveRunSheetStatus,
  RunSheetChangeSchema,
  RunSheetContentSchema,
  RunSheetMatchSchema,
  type RunSheetRow,
} from "../run-sheet/schema";
import { type Concerns, type ConcernWindow, sortReasons } from "./concerns";
import type { ConcernReason, MyWorkRow } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

export type RowsInput = { context: Context; concerns: Concerns; window: ConcernWindow };

/** `page` from 1, `limit` rows per page; the order is stable so pages never overlap. */
export type RowsPageInput = RowsInput & { page: number; limit: number };

/** Current run sheet versions of open orders with a line or a start inside the window. */
function loadCurrent({ context, window }: Omit<RowsInput, "concerns">) {
  const inside = { gte: window.start, lt: window.end };
  return context.db.runSheet.findMany({
    where: {
      current: true,
      order: {
        status: "ACTIVE",
        orderStatus: { closes: false },
        OR: [
          { lines: { some: { status: "ACTIVE", startsAt: inside } } },
          { desiredStartsAt: inside },
        ],
      },
    },
    select: {
      id: true,
      orderId: true,
      runSheetDefinitionId: true,
      responsibilityId: true,
      version: true,
      content: true,
      changes: true,
      matches: true,
      blocked: true,
      publishedAt: true,
      baseVersion: true,
      fulfilledAt: true,
      runSheetDefinition: { select: { name: true } },
      order: {
        select: {
          reference: true,
          title: true,
          desiredStartsAt: true,
          customer: { select: { name: true } },
        },
      },
    },
  });
}

type Loaded = Awaited<ReturnType<typeof loadCurrent>>[number];

/** Why the whole run sheet concerns the member: the order, its responsibility, or receiving it. */
function sheetReasons({ sheet, concerns }: { sheet: Loaded; concerns: Concerns }): ConcernReason[] {
  return [
    ...(concerns.orders.get(sheet.orderId) ?? []),
    ...(concerns.slots.get(`${sheet.orderId}:${sheet.responsibilityId}`) ?? []),
    ...(concerns.received.has(`${sheet.orderId}:${sheet.runSheetDefinitionId}`)
      ? (["RECIPIENT"] as const)
      : []),
  ];
}

/** The counts for a line: its own and the whole order's, with blocking matches marked. */
function needsOf({ row, rows, sheet }: { row: RunSheetRow; rows: RunSheetRow[]; sheet: Loaded }) {
  const matches = RunSheetMatchSchema.array().safeParse(sheet.matches);
  const blocking = new Set(
    (matches.success ? matches.data : [])
      .filter((m) => m.lineKey === row.key && m.blocking)
      .map((m) => m.name),
  );
  return rows
    .filter((r) => r.kind === "REQUIREMENT" && (r.parentKey === row.key || r.parentKey === null))
    .map((r) => ({
      name: r.label,
      quantity: r.quantity,
      scope: r.parentKey === null ? ("ORDER" as const) : ("LINE" as const),
      blocking: blocking.has(r.label),
    }));
}

/** The item rows of one run sheet that fall in the window and concern the member. */
function rowsOf({ sheet, concerns, window, context }: RowsInput & { sheet: Loaded }): MyWorkRow[] {
  const content = RunSheetContentSchema.safeParse(sheet.content);
  if (!content.success) return [];
  const changes = RunSheetChangeSchema.array().safeParse(sheet.changes);
  const pending = !sheet.publishedAt && changes.success ? changes.data : [];
  const status = deriveRunSheetStatus(sheet);
  const whole = sheetReasons({ sheet, concerns });
  const { rows } = content.data;
  return rows.flatMap((row): MyWorkRow[] => {
    if (row.kind !== "ITEM") return [];
    const reasons = [...whole, ...(concerns.lines.get(row.key) ?? [])];
    const at = row.startsAt ? new Date(row.startsAt) : sheet.order.desiredStartsAt;
    if (reasons.length === 0 || !at || at < window.start || at >= window.end) return [];
    const change = pending.find((c) => c.key === row.key);
    return [
      {
        ...{ key: row.key, runSheetId: sheet.id, runSheetName: sheet.runSheetDefinition.name },
        ...{
          version: sheet.version,
          status,
          orderId: sheet.orderId,
          reference: sheet.order.reference,
        },
        title: sheet.order.title,
        customerName: visibleTo({ context, feature: "customer", value: sheet.order.customer.name }),
        ...{ label: row.label, itemName: row.itemName, quantity: row.quantity, at },
        endsAt: row.endsAt ? new Date(row.endsAt) : null,
        timed: row.startsAt !== null,
        changed: change?.change === "CHANGED" ? change.changed : [],
        added: change?.change === "ADDED",
        needs: needsOf({ row, rows, sheet }),
        reasons: sortReasons({ reasons }),
      },
    ];
  });
}

/**
 * What the member prepares, runs or sets up in the window: the item rows of every current run
 * sheet that concerns them, by time (spec: home). A row of a run sheet that does not concern the
 * member as a whole still shows when its own line does (staffed, or an item they own). Paged in
 * memory: the rows come from run sheet snapshots, already bounded to the window.
 */
export async function myRows({ context, concerns, window, page, limit }: RowsPageInput) {
  const sheets = await loadCurrent({ context, window });
  const rows = sheets
    .flatMap((sheet) => rowsOf({ sheet, concerns, window, context }))
    .sort(
      (a, b) =>
        a.at.getTime() - b.at.getTime() ||
        a.reference - b.reference ||
        `${a.runSheetId}:${a.key}`.localeCompare(`${b.runSheetId}:${b.key}`),
    );
  const start = (page - 1) * limit;
  return { rows: rows.slice(start, start + limit), total: rows.length };
}
