import { describe, expect, it } from "vitest";
import { resolveToolUi } from "../src/ui-contract/resolve-tool-ui";

const mcp = ({ value }: { value: unknown }) => ({ content: [], structuredContent: value });

const payment = {
  id: null,
  depositPercent: 30,
  depositMinimumMinor: null,
  routes: [
    { method: "CARD", provider: "STRIPE" },
    { method: "SWISH", provider: null },
    { method: "INVOICE", provider: null },
  ],
  invoiceProvider: null,
  paymentOperator: "STRIPE",
};
const empty = { organization: null, payment: null, accounting: null, seats: null };

describe("setting cards", () => {
  it("shows exactly the settings the view was asked for, one card each", () => {
    const view = {
      ...empty,
      keys: ["timeZone"],
      organization: { timeZone: "Europe/Stockholm", emailDomain: null, domainJoin: true },
    };
    const ui = resolveToolUi({ toolName: "settings_view", output: mcp({ value: view }) });
    expect(ui).toEqual({ component: "setting-cards", props: { view } });
  });

  it("shows an owner's read or change as its own settings", () => {
    for (const toolName of ["paymentSettings_get", "paymentSettings_update"]) {
      const ui = resolveToolUi({ toolName, output: mcp({ value: payment }) });
      expect(ui).toEqual({
        component: "setting-cards",
        props: {
          view: { ...empty, keys: ["paymentOperator", "deposit", "invoices"], payment },
        },
      });
    }
  });

  it("falls back to JSON when the result is not the settings shape", () => {
    const ui = resolveToolUi({
      toolName: "settings_view",
      output: mcp({ value: { unexpected: true } }),
    });
    expect(ui.component).toBe("json");
  });
});
