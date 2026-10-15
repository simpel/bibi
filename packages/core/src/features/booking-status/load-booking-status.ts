import type { BookingStatus, Prisma } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { BookingStatusDto } from "./schema";

/** Prisma `include` that loads a status's allowed targets (active ones, in status order). */
export const WITH_TRANSITIONS = {
  transitionsFrom: {
    where: { toStatus: { status: "ACTIVE" } },
    select: { toStatusId: true },
    orderBy: [{ toStatus: { position: "asc" } }, { toStatusId: "asc" }],
  },
} satisfies Prisma.BookingStatusInclude;

type Row = BookingStatus & { transitionsFrom: readonly { toStatusId: string }[] };

export type ToBookingStatusDtoInput = { row: Row };

export function toBookingStatusDto({ row }: ToBookingStatusDtoInput): BookingStatusDto {
  const { transitionsFrom, ...status } = row;
  return { ...status, transitionsTo: transitionsFrom.map((target) => target.toStatusId) };
}

export type LoadBookingStatusInput = { context: Pick<OperationContext, "db">; id: string };

/** One active status with its transitions, or `null`. */
export async function loadBookingStatus({
  context,
  id,
}: LoadBookingStatusInput): Promise<BookingStatusDto | null> {
  const row = await context.db.bookingStatus.findFirst({
    where: { id },
    include: WITH_TRANSITIONS,
  });
  return row ? toBookingStatusDto({ row }) : null;
}

export type LoadAllInput = { context: Pick<OperationContext, "db"> };

/** Every active status in order (an organization has a handful, never pages of them). */
export async function loadAllBookingStatuses({ context }: LoadAllInput) {
  const rows = await context.db.bookingStatus.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_TRANSITIONS,
  });
  return rows.map((row) => toBookingStatusDto({ row }));
}
