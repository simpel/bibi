import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { toBookingStatusDto } from "./load-booking-status";
import { placeStatus } from "./place-status";
import type { BookingStatusCreateInput, BookingStatusDto } from "./schema";

export type InsertBookingStatusInput = { context: OperationContext } & BookingStatusCreateInput;

export type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

/** True when another active status already has this name. */
export async function bookingStatusNameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.bookingStatus.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

export const nameTaken = ({ name }: { name: string }) =>
  conflict({ message: `A booking status named "${name}" exists` });

/** Shared by `bookingStatus.create` and `.importTemplate`: unique name, place, insert, record. */
export async function insertBookingStatus({
  context,
  ...input
}: InsertBookingStatusInput): Promise<Result<BookingStatusDto>> {
  if (await bookingStatusNameTaken({ context, name: input.name })) {
    return nameTaken({ name: input.name });
  }
  const position = await placeStatus({ context, phase: input.phase });
  const row = await context.db.bookingStatus.create({
    data: { ...input, position, organizationId: context.organizationId },
  });
  const status = toBookingStatusDto({ row: { ...row, transitionsFrom: [] } });
  context.recordChange({ entityId: row.id, after: status });
  return ok({ value: status });
}
