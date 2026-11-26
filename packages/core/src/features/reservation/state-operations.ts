import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { releaseHolds } from "./holds";
import { mailGuest } from "./mail-message";
import {
  ReservationCancelInputSchema,
  type ReservationDto,
  ReservationIdInputSchema,
  ReservationSchema,
  type ReservationState,
} from "./schema";
import { loadReservation } from "./to-dto";

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

export const reservationStateOperations = [
  cancelReservation,
  seatReservation,
  unseatReservation,
  completeReservation,
  markReservationNoShow,
];
