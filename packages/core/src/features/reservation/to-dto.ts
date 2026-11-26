import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { ReservationDto } from "./schema";

type Ctx = { context: Pick<OperationContext, "db"> };

export const RESERVATION_INCLUDE = {
  tables: {
    where: { status: { in: ["ACTIVE", "ARCHIVED"] } },
    orderBy: { createdAt: "asc" },
    select: { elementId: true, status: true, element: { select: { label: true } } },
  },
  requirements: { select: { vocabularyValueId: true, quantity: true } },
} as const satisfies Prisma.ReservationInclude;

type Row = Prisma.ReservationGetPayload<{ include: typeof RESERVATION_INCLUDE }>;

/** A stored reservation as its DTO: the tables it holds now, else the ones it last held. */
export function toReservationDto({ row }: { row: Row }): ReservationDto {
  const active = row.tables.filter((hold) => hold.status === "ACTIVE");
  const shown = active.length > 0 ? active : row.tables;
  const tables = [...new Map(shown.map((hold) => [hold.elementId, hold])).values()];
  return {
    ...{ id: row.id, roomItemId: row.roomItemId, serviceId: row.serviceId },
    ...{ startsAt: row.startsAt, endsAt: row.endsAt, partySize: row.partySize },
    ...{ state: row.state, source: row.source },
    ...{ bookerName: row.bookerName, bookerPhone: row.bookerPhone, bookerEmail: row.bookerEmail },
    ...{
      note: row.note,
      customerId: row.customerId,
      contactId: row.contactId,
      orderId: row.orderId,
    },
    tables: tables.map((hold) => ({ elementId: hold.elementId, label: hold.element.label })),
    requirements: row.requirements,
    ...{ seatedAt: row.seatedAt, completedAt: row.completedAt, cancelledAt: row.cancelledAt },
    ...{ cancelledBy: row.cancelledBy, cancelReason: row.cancelReason, createdAt: row.createdAt },
  };
}

/** One reservation as its DTO, or null. */
export async function loadReservation({ context, id }: Ctx & { id: string }) {
  const row = await context.db.reservation.findFirst({
    where: { id },
    include: RESERVATION_INCLUDE,
  });
  return row ? toReservationDto({ row }) : null;
}
