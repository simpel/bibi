import { describe, expect, it } from "vitest";
import { applyOverrides, execute, getQuote, sendQuote } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { draftQuote } from "./quote-helpers";

type Denied = { feature: string };

const blindTo = ({ feature }: Denied) =>
  applyOverrides({ preset: "admin", overrides: [{ feature, action: "read", effect: "deny" }] });

describe("quotes and the lines they copy (ADR 0050, feature scope)", () => {
  it("sends only for a caller who may read the lines and their items", async () => {
    const { context, quote } = await draftQuote();
    const input = { id: quote.id };
    for (const feature of ["item", "program"]) {
      const blind = { ...context, permissions: blindTo({ feature }) };
      const denied = await execute({ operation: sendQuote, input, context: blind });
      expect(errorCode({ result: denied })).toBe("VALIDATION");
      if (!denied.ok) expect(denied.error.message).toBe(`Missing permission ${feature}:read`);
    }
    const sent = unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(sent.quoteStatus).toBe("SENT");
  });

  it("shows a draft's live lines only to a caller who may read the program", async () => {
    const { context, quote } = await draftQuote();
    const input = { id: quote.id };
    const seen = unwrap({ result: await execute({ operation: getQuote, input, context }) });
    expect(seen.lines).toHaveLength(1);
    const blind = { ...context, permissions: blindTo({ feature: "program" }) };
    const hidden = unwrap({
      result: await execute({ operation: getQuote, input, context: blind }),
    });
    expect(hidden.lines).toEqual([]);
  });
});
