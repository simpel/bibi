import { ok, type Result } from "../../errors/result";
import type { ExecuteContext } from "../../operations/context";
import type { DemoRefs } from "./demo-refs";
import { seedDemoCustomers } from "./seed-customers";
import type { DemoCatalog } from "./seed-items";
import { seedDemoTickets } from "./seed-tickets";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedDemoSalesInput = {
  context: ExecuteContext;
  org: DemoOrg;
  refs: DemoRefs;
  catalog: DemoCatalog;
  userIds: DemoUserIds;
};

/** Slices 4 and 5 of ADR 0025: customers first, then the tickets that refer to them. */
export async function seedDemoSales({
  context,
  org,
  refs,
  catalog,
  userIds,
}: SeedDemoSalesInput): Promise<Result<true>> {
  const customers = await seedDemoCustomers({ context, customers: org.customers, refs, catalog });
  if (!customers.ok) return customers;
  const tickets = await seedDemoTickets({ context, tickets: org.tickets, refs, userIds });
  if (!tickets.ok) return tickets;
  return ok({ value: true });
}
