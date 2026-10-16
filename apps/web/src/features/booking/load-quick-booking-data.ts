import "server-only";
import { listCustomers, listEntityTypes, listItems, type Result } from "@okazi/core";
import { runOperation } from "@/server/run-operation";
import type { QuickBookingData } from "./ui/quick-booking-data";

const LIMIT = 100;

const named = ({ items }: { items: { id: string; name: string }[] }) =>
  items.map(({ id, name }) => ({ id, name }));

/** Booking and program item types, customers and bookable items (one page each). */
export async function loadQuickBookingData(): Promise<Result<QuickBookingData>> {
  const [bookingTypes, programTypes, customers, items] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "BOOKING", limit: LIMIT } }),
    runOperation({ operation: listEntityTypes, input: { base: "PROGRAM_ITEM", limit: LIMIT } }),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listItems, input: { behaviour: "BOOKABLE", limit: LIMIT } }),
  ]);
  if (!bookingTypes.ok) return bookingTypes;
  if (!programTypes.ok) return programTypes;
  if (!customers.ok) return customers;
  if (!items.ok) return items;
  return {
    ok: true,
    value: {
      bookingTypes: named(bookingTypes.value),
      programItemTypes: named(programTypes.value),
      customers: named(customers.value),
      items: named(items.value),
    },
  };
}
