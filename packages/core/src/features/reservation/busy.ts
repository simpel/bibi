import type { OperationContext } from "../../operations/types";
import { loadElements } from "../floor-plan/element-rows";
import { loadCombinations } from "../table-combination/operations";
import type { BusySpan, CombinationUnit, TableUnit } from "./assign";

type Ctx = { context: Pick<OperationContext, "db"> };
type Span = { startsAt: Date; endsAt: Date };

/** A layout's tables and combinations as assignment sees them (ADR 0119). */
export type LayoutTables = { tables: TableUnit[]; combinations: CombinationUnit[] };

/** The seated pieces of a layout are its tables; combinations without limits take their tables' seats. */
export async function loadLayoutTables({
  context,
  layoutId,
}: Ctx & { layoutId: string }): Promise<LayoutTables> {
  const [pieces, combos] = await Promise.all([
    loadElements({ context, parent: { setupLayoutId: layoutId } }),
    loadCombinations({ context, layoutId }),
  ]);
  const tables = pieces
    .filter((piece) => !piece.fixed && (piece.shape === "ROUND" || piece.shape === "RECT"))
    .map((piece) => ({
      id: piece.id,
      label: piece.label,
      maxCovers: piece.maxCovers ?? piece.seatCount,
      minCovers: piece.minCovers ?? 1,
      onlineBookable: piece.onlineBookable,
    }));
  const byId = new Map(tables.map((table) => [table.id, table]));
  const combinations = combos.map((combo) => ({
    id: combo.id,
    elementIds: combo.elementIds,
    minCovers: combo.minCovers ?? 1,
    maxCovers:
      combo.maxCovers ??
      combo.elementIds.reduce((sum, id) => sum + (byId.get(id)?.maxCovers ?? 0), 0),
    onlineBookable: combo.onlineBookable,
  }));
  return { tables, combinations };
}

export type BusyInput = Ctx & Span & { elementIds: readonly string[]; except?: string };

/** Active holds on these tables that touch the span, per table; `except` leaves one reservation out. */
export async function loadBusy({ context, elementIds, startsAt, endsAt, except }: BusyInput) {
  const rows = await context.db.tableHold.findMany({
    where: {
      elementId: { in: [...elementIds] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(except ? { OR: [{ reservationId: null }, { reservationId: { not: except } }] } : {}),
    },
    select: { elementId: true, startsAt: true, endsAt: true, kind: true },
  });
  const busy = new Map<string, BusySpan[]>();
  for (const row of rows) busy.set(row.elementId, [...(busy.get(row.elementId) ?? []), row]);
  return busy;
}

/** The room's own holds that touch the span (ADR 0119): hard ones refuse tables, soft ones warn. */
export async function loadRoomHolds({
  context,
  roomItemId,
  startsAt,
  endsAt,
}: Ctx & Span & { roomItemId: string }) {
  const rows = await context.db.occupancy.findMany({
    where: { itemId: roomItemId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { startsAt: true, endsAt: true, holdKind: true },
  });
  return {
    hard: rows.filter((row) => row.holdKind !== "SOFT"),
    soft: rows.filter((row) => row.holdKind === "SOFT"),
  };
}

/** Reservations that hold covers: pending, booked, seated or completed. */
export const HOLDING_STATES = ["PENDING_PAYMENT", "BOOKED", "SEATED", "COMPLETED"] as const;

/** Starts and party sizes of the room's holding reservations in the span, for the pace limit. */
export async function loadCovers({
  context,
  roomItemId,
  startsAt,
  endsAt,
  except,
}: Ctx & Span & { roomItemId: string; except?: string }) {
  return context.db.reservation.findMany({
    where: {
      roomItemId,
      state: { in: [...HOLDING_STATES] },
      startsAt: { gte: startsAt, lt: endsAt },
      ...(except ? { id: { not: except } } : {}),
    },
    select: { startsAt: true, partySize: true },
  });
}

/** Whether any span overlaps `[startsAt, endsAt)`. */
export const touches = ({ spans, startsAt, endsAt }: Span & { spans: readonly Span[] }) =>
  spans.some((span) => span.startsAt < endsAt && startsAt < span.endsAt);
