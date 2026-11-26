import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { parseIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import { newPublicToken } from "../payment/public-token";
import { evaluateDay } from "./evaluate";
import { releaseHolds, writeHolds } from "./holds";
import { mailGuest } from "./mail-message";
import { publicRoom } from "./public-room";
import {
  PublicAvailabilityInputSchema,
  PublicAvailabilityOutputSchema,
  PublicCancelInputSchema,
  PublicChangeInputSchema,
  PublicCreateInputSchema,
  PublicCreateOutputSchema,
  PublicReservationSchema,
  PublicTokenInputSchema,
} from "./public-schema";
import { publicView } from "./public-view";
import { checkReferences } from "./references";
import { loadRoom, loadRoomDay } from "./room-day";
import { lockRoom } from "./write-operations";

/**
 * Guest operations (ADR 0119): run only by the public page and the public API as SYSTEM, after
 * the edge pinned the organization from the page slug or the manage token. `systemOnly`, so no
 * staff surface lists them, and exempt from parity (ADR 0119 decision 9).
 */
const PUBLIC = { systemOnly: true, approval: false } as const;

export const publicAvailability = defineOperation({
  name: "reservation.publicAvailability",
  kind: "query",
  description: "Times a guest can book for a party on a date in a published dining room.",
  input: PublicAvailabilityInputSchema,
  output: PublicAvailabilityOutputSchema,
  permission: "reservation:read",
  ...PUBLIC,
  handler: async ({ input, context }) => {
    const room = await publicRoom({ context, roomSlug: input.roomSlug });
    if (!room) return notFound({ entity: "Dining room" });
    const date = parseIsoDate({ value: input.date });
    const day = await loadRoomDay({ context, roomItemId: room.itemId, date });
    if (!day.ok) return notFound({ entity: "Dining room" });
    const slots = await evaluateDay({
      ...{ context, day: day.value, date, partySize: input.partySize, online: true },
      now: nowOf({ context }),
    });
    const open = slots.filter((slot) => slot.available);
    return ok({
      value: {
        timeZone: day.value.timeZone,
        slots: open.map(({ startsAt, endsAt, serviceName }) => ({ startsAt, endsAt, serviceName })),
      },
    });
  },
});

/** The online slot at exactly this start, re-checked under the room's lock. */
async function onlineSlot({
  context,
  roomItemId,
  startsAt,
  partySize,
  except,
}: {
  context: Parameters<typeof loadRoomDay>[0]["context"] & { now?: () => Date };
  roomItemId: string;
  startsAt: Date;
  partySize: number;
  except?: string;
}) {
  const zone = await loadRoom({ context, roomItemId });
  if (!zone.ok) return null;
  const date = toZonedParts({ instant: startsAt, timeZone: zone.value.timeZone }).date;
  const day = await loadRoomDay({ context, roomItemId, date });
  if (!day.ok) return null;
  const slots = await evaluateDay({
    ...{ context, day: day.value, date, partySize, online: true, except },
    now: nowOf({ context }),
  });
  return (
    slots.find((slot) => slot.startsAt.getTime() === startsAt.getTime() && slot.available) ?? null
  );
}

const TAKEN = "That time is no longer available: pick another";

export const publicCreateReservation = defineOperation({
  name: "reservation.publicCreate",
  kind: "command",
  description: "A guest books a table on the booking page or through the public API.",
  input: PublicCreateInputSchema,
  output: PublicCreateOutputSchema,
  permission: "reservation:write",
  ...PUBLIC,
  external: async ({ output, context }) => {
    const found = await publicView({ context, token: output.token });
    if (found) await mailGuest({ context, reservationId: found.id, kind: "confirmation" });
    return ok({ value: output });
  },
  handler: async ({ input, context }) => {
    const room = await publicRoom({ context, roomSlug: input.roomSlug });
    if (!room) return notFound({ entity: "Dining room" });
    const refs = await checkReferences({ context, requirements: input.requirements });
    if (!refs.ok) return refs;
    await lockRoom({ context, roomItemId: room.itemId });
    const { startsAt, partySize } = input;
    const slot = await onlineSlot({ context, roomItemId: room.itemId, startsAt, partySize });
    if (!slot?.tableIds) return conflict({ message: TAKEN });
    const token = newPublicToken();
    const row = await context.db.reservation.create({
      data: {
        ...{ organizationId: context.organizationId, roomItemId: room.itemId, startsAt, partySize },
        ...{
          endsAt: slot.endsAt,
          serviceId: slot.serviceId,
          source: input.source,
          locale: input.locale,
        },
        ...{
          bookerName: input.bookerName,
          bookerPhone: input.bookerPhone,
          bookerEmail: input.bookerEmail,
        },
        note: input.note ?? null,
        publicToken: token,
      },
    });
    await writeHolds({
      context,
      reservationId: row.id,
      elementIds: slot.tableIds,
      startsAt,
      endsAt: slot.endsAt,
    });
    if (input.requirements?.length) {
      await context.db.reservationRequirement.createMany({
        data: input.requirements.map((need) => ({
          ...need,
          reservationId: row.id,
          organizationId: context.organizationId,
        })),
      });
    }
    const found = await publicView({ context, token });
    if (!found) return notFound({ entity: "Reservation" });
    context.recordChange({
      entityId: row.id,
      after: { source: input.source, startsAt, partySize },
    });
    return ok({ value: { token, reservation: found.view } });
  },
});

export const publicGetReservation = defineOperation({
  name: "reservation.publicGet",
  kind: "query",
  description: "A guest reads their reservation by its manage token.",
  input: PublicTokenInputSchema,
  output: PublicReservationSchema,
  permission: "reservation:read",
  ...PUBLIC,
  handler: async ({ input, context }) => {
    const found = await publicView({ context, token: input.token });
    return found ? ok({ value: found.view }) : notFound({ entity: "Reservation" });
  },
});

const LATE = "It is too late to change this booking online: please call the restaurant";

export const publicChangeReservation = defineOperation({
  name: "reservation.publicChange",
  kind: "command",
  description: "A guest changes time, party size or their details before the cutoff.",
  input: PublicChangeInputSchema,
  output: PublicReservationSchema,
  permission: "reservation:write",
  ...PUBLIC,
  external: async ({ input, output, context }) => {
    const found = await publicView({ context, token: input.token });
    if (found) await mailGuest({ context, reservationId: found.id, kind: "changed" });
    return ok({ value: output });
  },
  handler: async ({ input, context }) => {
    const found = await publicView({ context, token: input.token });
    if (!found) return notFound({ entity: "Reservation" });
    if (!found.view.canChange) return conflict({ message: LATE });
    const { id, roomItemId, view } = found;
    const startsAt = input.startsAt ?? view.startsAt;
    const partySize = input.partySize ?? view.partySize;
    const moved = startsAt.getTime() !== view.startsAt.getTime() || partySize !== view.partySize;
    const data: Record<string, unknown> = {};
    for (const key of ["bookerName", "bookerPhone", "bookerEmail", "note"] as const)
      if (input[key] !== undefined) data[key] = input[key];
    if (moved) {
      await lockRoom({ context, roomItemId });
      const slot = await onlineSlot({ context, roomItemId, startsAt, partySize, except: id });
      if (!slot?.tableIds) return conflict({ message: TAKEN });
      await releaseHolds({ context, reservationId: id });
      Object.assign(data, { startsAt, endsAt: slot.endsAt, partySize, serviceId: slot.serviceId });
      await context.db.reservation.update({ where: { id }, data });
      await writeHolds({
        context,
        reservationId: id,
        elementIds: slot.tableIds,
        startsAt,
        endsAt: slot.endsAt,
      });
    } else if (Object.keys(data).length > 0) {
      await context.db.reservation.update({ where: { id }, data });
    }
    const after = await publicView({ context, token: input.token });
    if (!after) return notFound({ entity: "Reservation" });
    context.recordChange({
      entityId: id,
      before: { startsAt: view.startsAt, partySize: view.partySize },
      after: { startsAt, partySize },
    });
    return ok({ value: after.view });
  },
});

export const publicCancelReservation = defineOperation({
  name: "reservation.publicCancel",
  kind: "command",
  description: "A guest cancels their reservation before the cutoff.",
  input: PublicCancelInputSchema,
  output: PublicReservationSchema,
  permission: "reservation:write",
  ...PUBLIC,
  external: async ({ input, output, context }) => {
    const found = await publicView({ context, token: input.token });
    if (found) await mailGuest({ context, reservationId: found.id, kind: "cancelled" });
    return ok({ value: output });
  },
  handler: async ({ input, context }) => {
    const found = await publicView({ context, token: input.token });
    if (!found) return notFound({ entity: "Reservation" });
    if (!found.view.canChange) return conflict({ message: LATE });
    await context.db.reservation.update({
      where: { id: found.id },
      data: {
        state: "CANCELLED",
        cancelledAt: nowOf({ context }),
        cancelledBy: "GUEST",
        cancelReason: input.reason ?? null,
      },
    });
    await releaseHolds({ context, reservationId: found.id });
    const after = await publicView({ context, token: input.token });
    if (!after) return notFound({ entity: "Reservation" });
    context.recordChange({
      entityId: found.id,
      before: { state: found.view.state },
      after: { state: "CANCELLED" },
    });
    return ok({ value: after.view });
  },
});
