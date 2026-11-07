import { describe, expect, it } from "vitest";
import { resolveToolUi } from "../src/ui-contract/resolve-tool-ui";

const mcp = ({ value }: { value: unknown }) => ({ content: [], structuredContent: value });

const paymentSettings = {
  id: null,
  depositPercent: 30,
  depositMinimumMinor: null,
  invoiceProvider: null,
  paymentOperator: "STRIPE",
};

describe("settings cards", () => {
  it("answers a settings read and a settings change with the same editable card", () => {
    for (const toolName of ["paymentSettings_get", "paymentSettings_update"]) {
      const ui = resolveToolUi({ toolName, output: mcp({ value: paymentSettings }) });
      expect(ui).toEqual({
        component: "payment-settings-card",
        props: { settings: paymentSettings },
      });
    }
  });

  it("falls back to JSON when the result is not the settings shape", () => {
    const ui = resolveToolUi({
      toolName: "accountingSettings_get",
      output: mcp({ value: { unexpected: true } }),
    });
    expect(ui.component).toBe("json");
  });
});
