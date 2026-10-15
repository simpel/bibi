import "server-only";
import { listBookingStatuses, listCustomers, listMembers, type Result } from "@okazi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import type { BookingFormData } from "./ui/booking-form-data";

const LIMIT = 100;

/**
 * Booking types, lists, customers, members and statuses (one page each). Members are optional:
 * without `member:read` owners show as "–" and cannot be picked.
 */
export async function loadBookingData(): Promise<Result<BookingFormData>> {
  const [typed, customers, members, statuses] = await Promise.all([
    loadTypedFormData({ base: "BOOKING" }),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
    runOperation({ operation: listBookingStatuses, input: { limit: LIMIT } }),
  ]);
  if (!typed.ok) return typed;
  if (!customers.ok) return customers;
  if (!statuses.ok) return statuses;
  const people = members.ok ? members.value.items : [];
  return {
    ok: true,
    value: {
      ...typed.value,
      customers: customers.value.items.map(({ id, name }) => ({ id, name })),
      members: people.map(({ userId, name }) => ({ id: userId, name })),
      statuses: statuses.value.items,
    },
  };
}
