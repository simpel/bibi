import { ok, type Result } from "../../errors/result";
import type { ExecuteContext } from "../../operations/context";
import type { DemoRefs } from "./demo-refs";
import { seedDemoBookings } from "./seed-bookings";
import { seedDemoCustomers } from "./seed-customers";
import type { DemoCatalog } from "./seed-items";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedDemoSalesInput = {
  context: ExecuteContext;
  org: DemoOrg;
  refs: DemoRefs;
  catalog: DemoCatalog;
  userIds: DemoUserIds;
};

/** Slices 4 and 5 of ADR 0025: customers first, then the bookings that refer to them. */
export async function seedDemoSales({
  context,
  org,
  refs,
  catalog,
  userIds,
}: SeedDemoSalesInput): Promise<Result<true>> {
  const customers = await seedDemoCustomers({ context, customers: org.customers, refs, catalog });
  if (!customers.ok) return customers;
  const bookings = await seedDemoBookings({ context, bookings: org.bookings, refs, userIds });
  if (!bookings.ok) return bookings;
  return ok({ value: true });
}
