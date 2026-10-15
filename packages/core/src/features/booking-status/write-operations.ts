import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { bookingStatusNameTaken, insertBookingStatus, nameTaken } from "./insert-booking-status";
import { loadBookingStatus, toBookingStatusDto } from "./load-booking-status";
import {
  BookingStatusCreateInputSchema,
  BookingStatusIdInputSchema,
  BookingStatusSchema,
  BookingStatusUpdateInputSchema,
} from "./schema";

export const createBookingStatus = defineOperation({
  name: "bookingStatus.create",
  kind: "command",
  description:
    "Create a booking status: a name, a hex color and its fixed phase. It is placed after the " +
    "last status of its phase. Allow transitions to and from it with bookingStatus.setTransitions.",
  input: BookingStatusCreateInputSchema,
  output: BookingStatusSchema,
  permission: "bookingStatus:admin",
  handler: ({ input, context }) => insertBookingStatus({ context, ...input }),
});

export const updateBookingStatus = defineOperation({
  name: "bookingStatus.update",
  kind: "command",
  description:
    "Rename a booking status or change its color. The phase is fixed: archive the status and " +
    "create a new one to change it.",
  input: BookingStatusUpdateInputSchema,
  output: BookingStatusSchema,
  permission: "bookingStatus:admin",
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await loadBookingStatus({ context, id });
    if (!before) return notFound({ entity: "Booking status" });
    const { name } = data;
    const renamed = name !== undefined && name !== before.name;
    if (renamed && (await bookingStatusNameTaken({ context, name, id })))
      return nameTaken({ name });
    await context.db.bookingStatus.update({ where: { id }, data });
    const after = await loadBookingStatus({ context, id });
    if (!after) return notFound({ entity: "Booking status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

type DetachInput = { context: OperationContext; id: string };

/** Removes every transition into the archived status, recorded on each status it left. */
async function detachIncoming({ context, id }: DetachInput) {
  const sources = await context.db.bookingStatusTransition.findMany({
    where: { toStatusId: id },
    select: { fromStatusId: true },
  });
  const befores = await Promise.all(
    sources.map(({ fromStatusId }) => loadBookingStatus({ context, id: fromStatusId })),
  );
  await context.db.bookingStatusTransition.deleteMany({ where: { toStatusId: id } });
  for (const before of befores) {
    if (!before) continue;
    const after = { ...before, transitionsTo: before.transitionsTo.filter((to) => to !== id) };
    context.recordChange({ entityId: before.id, before, after });
  }
}

export const archiveBookingStatus = defineOperation({
  name: "bookingStatus.archive",
  kind: "command",
  description:
    "Archive a booking status (statuses are never deleted, so bookings keep theirs). Its " +
    "transitions are removed. Refused for the last active status of a phase: every phase " +
    "needs a status.",
  input: BookingStatusIdInputSchema,
  output: BookingStatusSchema,
  permission: "bookingStatus:admin",
  handler: async ({ input: { id }, context }) => {
    const before = await loadBookingStatus({ context, id });
    if (!before) return notFound({ entity: "Booking status" });
    const inPhase = await context.db.bookingStatus.count({ where: { phase: before.phase } });
    if (inPhase <= 1) {
      return conflict({ message: `"${before.name}" is the last status of phase ${before.phase}` });
    }
    await detachIncoming({ context, id });
    await context.db.bookingStatusTransition.deleteMany({ where: { fromStatusId: id } });
    const row = await context.db.bookingStatus.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const after = toBookingStatusDto({ row: { ...row, transitionsFrom: [] } });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
