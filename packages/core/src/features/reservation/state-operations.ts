import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { releaseHolds, writeHolds } from "./holds";
import { mailGuest } from "./mail-message";
import { planBooking } from "./plan-booking";
import {
  ReservationCancelInputSchema,
  type ReservationDto,
  ReservationIdInputSchema,
  ReservationSchema,
  type ReservationState,
} from "./schema";
import { loadReservation } from "./to-dto";
import { lockRoom } from "./write-operations";

type MoveInput = {
  context: OperationContext;
  id: string;
  from: readonly ReservationState[];
  to: ReservationState;
  /** Columns the move sets besides `state`. */
  data?: Record<string, unknown>;
  release?: boolean;
};

/** One lifecycle move (ADR 0119): only from the listed states, else CONFLICT. */
export async function moveReservation({
  context,
  id,
  from,
  to,
  data = {},
  release = false,
}: MoveInput): Promise<Result<ReservationDto>> {
  const before = await loadReservation({ context, id });
  if (!before) return notFound({ entity: "Reservation" });
  if (!from.includes(before.state))
    return conflict({
      message: `A ${before.state.toLowerCase()} reservation cannot become ${to.toLowerCase()}`,
    });
  await context.db.reservation.update({ where: { id }, data: { ...data, state: to } });
  if (release) await releaseHolds({ context, reservationId: id });
  const after = await loadReservation({ context, id });
  if (!after) return notFound({ entity: "Reservation" });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
}

export const cancelReservation = defineOperation({
  name: "reservation.cancel",
  kind: "command",
  description: "Cancel a pending or booked reservation for the guest; its tables are freed.",
  input: ReservationCancelInputSchema,
  output: ReservationSchema,
  permission: "reservation:write",
  external: ({ output, context }) =>
    mailGuest({ context, reservationId: output.id, kind: "cancelled" }).then(() =>
      ok({ value: output }),
    ),
  handler: ({ input, context }) =>
    moveReservation({
      ...{ context, id: input.id, from: ["PENDING_PAYMENT", "BOOKED"], to: "CANCELLED" },
      data: {
        cancelledAt: nowOf({ context }),
        cancelledBy: "STAFF",
        cancelReason: input.reason ?? null,
      },
      release: true,
    }),
});

export const seatReservation = defineOperation({
  name: "reservation.seat",
  kind: "command",
  description: "Mark a booked party as seated at its tables.",
  input: ReservationIdInputSchema,
  output: ReservationSchema,
  permission: "reservation:write",
  handler: ({ input, context }) =>
    moveReservation({
      ...{ context, id: input.id, from: ["BOOKED"], to: "SEATED" },
      data: { seatedAt: nowOf({ context }) },
    }),
});

export const unseatReservation = defineOperation({
  name: "reservation.unseat",
  kind: "command",
  description: "Undo seating: the party is booked again (a mis-click on the floor).",
  input: ReservationIdInputSchema,
  output: ReservationSchema,
  permission: "reservation:write",
  handler: ({ input, context }) =>
    moveReservation({
      ...{ context, id: input.id, from: ["SEATED"], to: "BOOKED" },
      data: { seatedAt: null },
    }),
});

export const completeReservation = defineOperation({
  name: "reservation.complete",
  kind: "command",
  description: "Mark a seated party as gone; its tables stay held until the booked end.",
  input: ReservationIdInputSchema,
  output: ReservationSchema,
  permission: "reservation:write",
  handler: ({ input, context }) =>
    moveReservation({
      ...{ context, id: input.id, from: ["SEATED"], to: "COMPLETED" },
      data: { completedAt: nowOf({ context }) },
    }),
});

export const markReservationNoShow = defineOperation({
  name: "reservation.markNoShow",
  kind: "command",
  description: "Mark a booked party that never came; its tables are freed.",
  input: ReservationIdInputSchema,
  output: ReservationSchema,
  permission: "reservation:write",
  handler: ({ input, context }) =>
    moveReservation({
      ...{ context, id: input.id, from: ["BOOKED"], to: "NO_SHOW" },
      release: true,
    }),
});

const MINUTE_MS = 60_000;

export const revertReservationNoShow = defineOperation({
  name: "reservation.revertNoShow",
  kind: "command",
  description:
    "Undo a no-show: the guests came after all. The party is booked again with the tables it " +
    "had, else other free ones for the same time (CONFLICT when none is free).",
  input: ReservationIdInputSchema,
  output: ReservationSchema,
  permission: "reservation:write",
  handler: async ({ input, context }) => {
    const before = await loadReservation({ context, id: input.id });
    if (!before) return notFound({ entity: "Reservation" });
    if (before.state !== "NO_SHOW")
      return conflict({
        message: `A ${before.state.toLowerCase()} reservation is not a no-show`,
      });
    await lockRoom({ context, roomItemId: before.roomItemId });
    const base = {
      ...{ context, roomItemId: before.roomItemId, startsAt: before.startsAt },
      ...{ partySize: before.partySize, except: before.id },
      durationMinutes: (before.endsAt.getTime() - before.startsAt.getTime()) / MINUTE_MS,
    };
    const kept = await planBooking({
      ...base,
      tableIds: before.tables.map((table) => table.elementId),
    });
    const plan = kept.ok ? kept : await planBooking(base);
    if (!plan.ok) return plan;
    const { endsAt, tableIds } = plan.value;
    await context.db.reservation.update({
      where: { id: before.id },
      data: { state: "BOOKED", endsAt },
    });
    await writeHolds({
      ...{ context, reservationId: before.id, elementIds: tableIds },
      ...{ startsAt: before.startsAt, endsAt },
    });
    const after = await loadReservation({ context, id: before.id });
    if (!after) return notFound({ entity: "Reservation" });
    context.recordChange({ entityId: before.id, before, after });
    return ok({ value: after });
  },
});

export const reservationStateOperations = [
  cancelReservation,
  seatReservation,
  unseatReservation,
  completeReservation,
  markReservationNoShow,
  revertReservationNoShow,
];
