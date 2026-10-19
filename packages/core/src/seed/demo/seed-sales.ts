import { ok, type Result } from "../../errors/result";
import type { ExecuteContext } from "../../operations/context";
import { withDemoPayments } from "./demo-payments";
import type { DemoRefs } from "./demo-refs";
import { seedDemoCustomers } from "./seed-customers";
import type { DemoCatalog } from "./seed-items";
import { activateDemoPayments } from "./seed-money";
import { seedDemoTemplates } from "./seed-templates";
import { seedDemoTickets } from "./seed-tickets";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedDemoSalesInput = {
  context: ExecuteContext;
  org: DemoOrg;
  refs: DemoRefs;
  catalog: DemoCatalog;
  userIds: DemoUserIds;
  /** No phases yet (`--skip-pipeline`): the customers only. */
  skipPipeline?: boolean;
};

/**
 * Slices 4 and 5 of ADR 0025: customers first, then the predefined tickets and the tickets that
 * refer to them with their money (the pipeline is seeded before).
 */
export async function seedDemoSales({
  context,
  org,
  refs,
  catalog,
  userIds,
  skipPipeline = false,
}: SeedDemoSalesInput): Promise<Result<true>> {
  const customers = await seedDemoCustomers({ context, customers: org.customers, refs, catalog });
  if (!customers.ok) return customers;
  if (skipPipeline) return ok({ value: true });
  const templates = await seedDemoTemplates({ context, templates: org.templates, refs });
  if (!templates.ok) return templates;
  // Payments go to the demo gateway and the memory provider, never to Stripe (ADR 0057).
  return withDemoPayments({
    run: async () => {
      const account = await activateDemoPayments({ context, org });
      if (!account.ok) return account;
      const tickets = await seedDemoTickets({ context, tickets: org.tickets, refs, userIds });
      return tickets.ok ? ok({ value: true as const }) : tickets;
    },
  });
}
