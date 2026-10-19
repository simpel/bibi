import { describe, expect, it } from "vitest";
import { applyOverrides } from "../src/index";
import { createTestQuote, quoteSetup } from "./quote-helpers";

const UNAVAILABLE = "Item not found or not allowed";

describe("quote lines need item:view (ADR 0050, feature scope)", () => {
  it("refuses a line whose item the caller may not view, like an unknown item", async () => {
    const { context, ticket, lunch } = await quoteSetup();
    const overrides = [{ feature: "item", action: "view", effect: "deny" }];
    const blind = { ...context, permissions: applyOverrides({ preset: "admin", overrides }) };
    const lines = [{ itemId: lunch.id, quantity: 1 }];
    const denied = await createTestQuote({ context: blind, ticketId: ticket.id, lines }).catch(
      (e) => e,
    );
    expect(denied).toMatchObject({ code: "VALIDATION", message: UNAVAILABLE });
    expect(denied.issues).toEqual([{ path: "lines.0.itemId", message: UNAVAILABLE }]);
    const unknown = await createTestQuote({
      context,
      ticketId: ticket.id,
      lines: [{ itemId: "nope", quantity: 1 }],
    }).catch((e) => e);
    expect(unknown).toMatchObject({ code: "VALIDATION", message: UNAVAILABLE });
  });
});
