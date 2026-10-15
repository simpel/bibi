import {
  type BookingSeriesUpdateOccurrencesInput,
  createBookingSeries,
  createOccupancy,
  type ExecuteContext,
  execute,
  expandOccurrences,
  updateBookingSeriesOccurrences,
} from "../src/index";
import { bookingSetup } from "./booking-helpers";
import { unwrap } from "./helpers";
import { createBookableItem } from "./occupancy-helpers";

/** S1 in docs/demo-seed.md: the first Tuesday of every month, 09–13 Stockholm time, 10 times. */
export const S1_RULE = "FREQ=MONTHLY;BYDAY=1TU;COUNT=10";
export const S1_START = new Date("2026-11-03T08:00:00Z");
export const S1_MINUTES = 240;

/** A provisioned organization with a booking type, a customer and a bookable room. */
export async function seriesSetup() {
  const setup = await bookingSetup();
  const room = await createBookableItem({ context: setup.context });
  return { ...setup, room };
}

export type BlockOccurrenceInput = { context: ExecuteContext; itemId: string; index: number };

/** Blocks the item (INTERNAL) for exactly the given occurrence of S1. */
export async function blockOccurrence({ context, itemId, index }: BlockOccurrenceInput) {
  const expanded = unwrap({
    result: expandOccurrences({
      rule: { freq: "MONTHLY", byDay: ["1TU"], count: 10 },
      start: S1_START,
      durationMinutes: S1_MINUTES,
    }),
  });
  const occurrence = expanded.occurrences[index - 1];
  if (!occurrence) throw new Error(`No occurrence ${index}`);
  const input = {
    itemId,
    type: "INTERNAL" as const,
    startsAt: occurrence.start,
    endsAt: occurrence.end,
  };
  return unwrap({ result: await execute({ operation: createOccupancy, input, context }) });
}

export type CreateS1Input = {
  context: ExecuteContext;
  entityTypeId: string;
  customerId: string;
  itemIds: string[];
};

export const createS1 = ({ context, ...input }: CreateS1Input) =>
  execute({
    operation: createBookingSeries,
    input: { ...input, rule: S1_RULE, startsAt: S1_START, durationMinutes: S1_MINUTES },
    context,
  });

export type UpdateS1Input = {
  context: ExecuteContext;
  seriesId: string;
  fromIndex: number;
  scope: "THIS" | "FOLLOWING";
  patch: BookingSeriesUpdateOccurrencesInput["patch"];
};

export const updateOccurrences = ({ context, ...input }: UpdateS1Input) =>
  execute({ operation: updateBookingSeriesOccurrences, input, context });

/** The ids of the active `BOOKING` occupancies on the item, by the booking that holds them. */
export async function bookingsOn({ context, itemId }: { context: ExecuteContext; itemId: string }) {
  const rows = await context.db.occupancy.findMany({ where: { itemId, type: "BOOKING" } });
  return rows.map((row) => row.sourceId);
}
