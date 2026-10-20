import { describe, expect, it } from "vitest";
import { applyOverrides, archiveCustomer, execute, getCustomer } from "../src/index";
import { unwrap } from "./helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

const withoutTickets = applyOverrides({
  preset: "admin",
  overrides: [{ feature: "ticket", action: "read", effect: "deny" }],
});

describe("customer feature scope (ADR 0050)", () => {
  it("fills ticketCount only for a caller who may view tickets", async () => {
    const { context, type, customer } = await ticketSetup();
    await createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
    const input = { id: customer.id };
    const full = unwrap({ result: await execute({ operation: getCustomer, input, context }) });
    expect(full.ticketCount).toBe(1);
    const blind = { ...context, permissions: withoutTickets };
    const hidden = unwrap({
      result: await execute({ operation: getCustomer, input, context: blind }),
    });
    expect(hidden.ticketCount).toBeNull();
  });

  it("says only that the customer is in use when its tickets are hidden", async () => {
    const { context, type, customer } = await ticketSetup();
    await createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
    const input = { id: customer.id };
    const detailed = await execute({ operation: archiveCustomer, input, context });
    expect(detailed).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(detailed.ok ? "" : detailed.error.message).toContain("1 tickets");
    const blind = { ...context, permissions: withoutTickets };
    const neutral = await execute({ operation: archiveCustomer, input, context: blind });
    expect(neutral).toMatchObject({
      ok: false,
      error: { code: "CONFLICT", message: "It is still in use" },
    });
  });
});
