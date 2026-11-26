import { z } from "zod";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { nowOf } from "../../time/now";
import { mailGuest } from "./mail-message";

const HOUR_MS = 3_600_000;

export const ReservationRemindOutputSchema = z.object({
  ids: z.array(z.string()).describe("Reservations reminded in this run"),
});

/**
 * Picks booked reservations starting 23 to 25 hours from now whose booker has an email and has
 * had no reminder, marks them, and mails each one after the commit (ADR 0119). Run hourly by the
 * worker as SYSTEM, so every booking is reminded once, the day before.
 */
export const remindReservations = defineOperation({
  name: "reservation.sendReminders",
  kind: "command",
  description: "Mail tomorrow's guests a reminder with their manage link. System only.",
  input: z.object({}),
  output: ReservationRemindOutputSchema,
  permission: "reservation:write",
  systemOnly: true,
  external: async ({ output, context }) => {
    for (const reservationId of output.ids)
      await mailGuest({ context, reservationId, kind: "reminder" });
    return ok({ value: output });
  },
  handler: async ({ context }) => {
    const now = nowOf({ context });
    const due = await context.db.reservation.findMany({
      where: {
        state: "BOOKED",
        reminderSentAt: null,
        bookerEmail: { not: null },
        startsAt: {
          gte: new Date(now.getTime() + 23 * HOUR_MS),
          lt: new Date(now.getTime() + 25 * HOUR_MS),
        },
      },
      select: { id: true },
    });
    const ids = due.map((row) => row.id);
    if (ids.length > 0) {
      await context.db.reservation.updateMany({
        where: { id: { in: ids } },
        data: { reminderSentAt: now },
      });
      context.recordChange({ entityId: "reservations", after: { reminded: ids.length } });
    }
    return ok({ value: { ids } });
  },
});
