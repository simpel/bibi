import type { z } from "zod";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { newPublicToken } from "../payment/public-token";
import { releaseHolds, writeHolds } from "./holds";
import { mailGuest } from "./mail-message";
import { planBooking } from "./plan-booking";
import { checkReferences } from "./references";
import {
  ReservationCreateInputSchema,
  type ReservationRequirementSchema,
  ReservationUpdateInputSchema,
  ReservationWithWarningsSchema,
} from "./schema";
import { loadReservation } from "./to-dto";

type Ctx = { context: OperationContext };
type Requirement = z.infer<typeof ReservationRequirementSchema>;

/** One room's table and whole-room bookings run one at a time (ADR 0119). */
export const lockRoom = ({ context, roomItemId }: Ctx & { roomItemId: string }) =>
  context.db.$advisoryLock({ key: `room:${roomItemId}` });

/** Replaces the reservation's requirement counts. */
async function writeRequirements({
  context,
  reservationId,
  requirements,
}: Ctx & { reservationId: string; requirements: readonly Requirement[] }) {
  await context.db.reservationRequirement.deleteMany({ where: { reservationId } });
  if (requirements.length === 0) return;
  await context.db.reservationRequirement.createMany({
    data: requirements.map((row) => ({
      ...row,
      reservationId,
      organizationId: context.organizationId,
    })),
  });
}

export const createReservation = defineOperation({
  name: "reservation.create",
  kind: "command",
  description:
    "Book a table for a party (ADR 0119), e.g. 4 people tomorrow 18:30 for Andersson. The start " +
    "should be one of the sitting's times (reservation.availability); tables default to the " +
    "smallest free fit. A taken table or a whole-room booking at that time is CONFLICT; a start " +
    "outside a sitting or over the pace is saved with warnings.",
  input: ReservationCreateInputSchema,
  output: ReservationWithWarningsSchema,
  permission: "reservation:write",
  // A booker with an email gets the confirmation with the manage link, after the commit.
  external: ({ output, context }) =>
    mailGuest({ context, reservationId: output.id, kind: "confirmation" }).then(() =>
      ok({ value: output }),
    ),
  handler: async ({ input, context }) => {
    const { roomItemId, startsAt, partySize, durationMinutes, tableIds, requirements } = input;
    const refs = await checkReferences({ context, ...input });
    if (!refs.ok) return refs;
    await lockRoom({ context, roomItemId });
    const plan = await planBooking({
      context,
      roomItemId,
      startsAt,
      partySize,
      durationMinutes,
      tableIds,
    });
    if (!plan.ok) return plan;
    const row = await context.db.reservation.create({
      data: {
        ...{ organizationId: context.organizationId, roomItemId, startsAt, partySize },
        ...{ endsAt: plan.value.endsAt, serviceId: plan.value.serviceId, source: "STAFF" },
        bookerName: input.bookerName,
        bookerPhone: input.bookerPhone ?? null,
        bookerEmail: input.bookerEmail ?? null,
        note: input.note ?? null,
        customerId: input.customerId ?? null,
        contactId: input.contactId ?? null,
        publicToken: newPublicToken(),
      },
    });
    await writeHolds({
      context,
      reservationId: row.id,
      elementIds: plan.value.tableIds,
      startsAt,
      endsAt: plan.value.endsAt,
    });
    await writeRequirements({ context, reservationId: row.id, requirements: requirements ?? [] });
    const after = await loadReservation({ context, id: row.id });
    if (!after) return notFound({ entity: "Reservation" });
    context.recordChange({ entityId: row.id, after });
    return ok({ value: { ...after, warnings: plan.value.warnings } });
  },
});

const OPEN_STATES = new Set(["PENDING_PAYMENT", "BOOKED"]);

export const updateReservation = defineOperation({
  name: "reservation.update",
  kind: "command",
  description:
    "Change a booked reservation: time, party size, length, tables, booker, note, customer or " +
    "needs. A new time or party size keeps the current tables when they still fit and are free, " +
    "else finds new ones (CONFLICT when none). Only PENDING_PAYMENT or BOOKED can change.",
  input: ReservationUpdateInputSchema,
  output: ReservationWithWarningsSchema,
  permission: "reservation:write",
  external: ({ output, context }) =>
    mailGuest({ context, reservationId: output.id, kind: "changed" }).then(() =>
      ok({ value: output }),
    ),
  handler: async ({ input, context }) => {
    const before = await loadReservation({ context, id: input.id });
    if (!before) return notFound({ entity: "Reservation" });
    if (!OPEN_STATES.has(before.state))
      return conflict({ message: `A ${before.state.toLowerCase()} reservation cannot be changed` });
    const customerId = input.customerId === undefined ? before.customerId : input.customerId;
    const contactId = input.contactId === undefined ? before.contactId : input.contactId;
    const refs = await checkReferences({
      context,
      customerId,
      contactId,
      requirements: input.requirements,
    });
    if (!refs.ok) return refs;
    await lockRoom({ context, roomItemId: before.roomItemId });
    const startsAt = input.startsAt ?? before.startsAt;
    const partySize = input.partySize ?? before.partySize;
    const moved = input.startsAt !== undefined || input.partySize !== undefined;
    const sameLength = (before.endsAt.getTime() - before.startsAt.getTime()) / 60_000;
    const current = before.tables.map((table) => table.elementId);
    const base = { context, roomItemId: before.roomItemId, startsAt, partySize, except: before.id };
    const durationMinutes = input.durationMinutes ?? (moved ? undefined : sameLength);
    // Same party: keep the current tables when they are free at the new time, else find new ones.
    const keep = input.tableIds ?? (input.partySize === undefined ? current : undefined);
    const kept = keep ? await planBooking({ ...base, durationMinutes, tableIds: keep }) : null;
    const plan =
      kept?.ok || input.tableIds ? kept : await planBooking({ ...base, durationMinutes });
    if (!plan) return notFound({ entity: "Reservation" });
    if (!plan.ok) return plan;
    await releaseHolds({ context, reservationId: before.id });
    const { endsAt, serviceId, tableIds } = plan.value;
    await context.db.reservation.update({
      where: { id: before.id },
      data: {
        ...{ startsAt, endsAt, partySize, serviceId, customerId, contactId },
        ...(input.bookerName !== undefined ? { bookerName: input.bookerName } : {}),
        ...(input.bookerPhone !== undefined ? { bookerPhone: input.bookerPhone } : {}),
        ...(input.bookerEmail !== undefined ? { bookerEmail: input.bookerEmail } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      },
    });
    await writeHolds({ context, reservationId: before.id, elementIds: tableIds, startsAt, endsAt });
    if (input.requirements)
      await writeRequirements({
        context,
        reservationId: before.id,
        requirements: input.requirements,
      });
    const after = await loadReservation({ context, id: before.id });
    if (!after) return notFound({ entity: "Reservation" });
    context.recordChange({ entityId: before.id, before, after });
    return ok({ value: { ...after, warnings: plan.value.warnings } });
  },
});
