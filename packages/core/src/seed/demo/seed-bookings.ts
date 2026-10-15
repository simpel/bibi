import { ok, type Result } from "../../errors/result";
import { createBooking } from "../../features/booking/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { addDays } from "../../recurrence/plain-date";
import { fromZonedParts, toZonedParts } from "../../recurrence/zoned-time";
import type { DemoBooking } from "./booking-types";
import type { DemoRefs } from "./demo-refs";
import { missing, resolveFields } from "./seed-fields";
import type { DemoUserIds } from "./users";

const TIME_ZONE = "Europe/Stockholm";

export type SeedBookingsInput = {
  context: ExecuteContext;
  bookings: readonly DemoBooking[];
  refs: DemoRefs;
  userIds: DemoUserIds;
  /** The day of the run (D in `docs/demo-seed.md`); defaults to now. */
  now?: Date;
};

type AtInput = { now: Date; day: number; time: string };

/** D + `day` at the local time `HH:MM` in Stockholm. */
function at({ now, day, time }: AtInput): Date {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const today = toZonedParts({ instant: now, timeZone: TIME_ZONE }).date;
  const date = addDays({ date: today, days: day });
  return fromZonedParts({ date, time: { hour, minute, second: 0 }, timeZone: TIME_ZONE });
}

type OwnerInput = { userIds: DemoUserIds; name: string | undefined };

const owner = ({ userIds, name }: OwnerInput) => (name ? userIds.get(name) : undefined);

type BookingInput = Omit<SeedBookingsInput, "bookings" | "now"> & {
  booking: DemoBooking;
  now: Date;
};

async function seedBooking({ context, refs, userIds, booking, now }: BookingInput) {
  const type = refs.bookingTypes.get(booking.type);
  if (!type) return missing({ what: `booking type ${booking.type}` });
  const customer = await context.db.customer.findFirst({ where: { name: booking.customer } });
  if (!customer) return missing({ what: `customer ${booking.customer}` });
  const salesOwnerId = owner({ userIds, name: booking.sales });
  const coordinatorId = owner({ userIds, name: booking.coordinator });
  if (booking.sales && !salesOwnerId) return missing({ what: `user ${booking.sales}` });
  if (booking.coordinator && !coordinatorId)
    return missing({ what: `user ${booking.coordinator}` });
  const fields = resolveFields({ fields: booking.fields, type });
  if (!fields.ok) return fields;
  const input = {
    entityTypeId: type.id,
    customerId: customer.id,
    startsAt: at({ now, day: booking.day, time: booking.from }),
    endsAt: at({ now, day: booking.day, time: booking.to }),
    estimatedHeadcount: booking.headcount,
    salesOwnerId: salesOwnerId ?? null,
    coordinatorId: coordinatorId ?? null,
    fields: fields.value,
  };
  return execute({ operation: createBooking, input, context });
}

/** Slice 5 of ADR 0025, started: bookings with salesperson and coordinator, as SYSTEM. */
export async function seedDemoBookings({
  bookings,
  now = new Date(),
  ...rest
}: SeedBookingsInput): Promise<Result<true>> {
  for (const booking of bookings) {
    const result = await seedBooking({ ...rest, booking, now });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
