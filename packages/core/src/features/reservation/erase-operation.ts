import { z } from "zod";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { nowOf } from "../../time/now";

/** Days after a visit the booker's personal data is kept (ADR 0119, 0032). */
export const BOOKER_RETENTION_DAYS = 90;
const DAY_MS = 86_400_000;

export const ReservationEraseOutputSchema = z.object({
  erased: z.number().int().describe("Reservations whose booker data was erased"),
});

/**
 * Empties the booker's name, phone, email and note of reservations that ended more than 90 days
 * ago (ADR 0119): times, party sizes, tables and need counts stay for statistics. Run nightly by
 * the worker as SYSTEM; one audit row per run, never the erased values.
 */
export const eraseReservationBookers = defineOperation({
  name: "reservation.eraseBookers",
  kind: "command",
  description: "Erase booker data of reservations that ended over 90 days ago. System only.",
  input: z.object({}),
  output: ReservationEraseOutputSchema,
  permission: "reservation:write",
  systemOnly: true,
  handler: async ({ context }) => {
    const now = nowOf({ context });
    const before = new Date(now.getTime() - BOOKER_RETENTION_DAYS * DAY_MS);
    const { count } = await context.db.reservation.updateMany({
      where: { endsAt: { lt: before }, erasedAt: null, status: { in: ["ACTIVE", "ARCHIVED"] } },
      data: { bookerName: null, bookerPhone: null, bookerEmail: null, note: null, erasedAt: now },
    });
    context.recordChange({ entityId: "reservations", after: { erased: count, before } });
    return ok({ value: { erased: count } });
  },
});
