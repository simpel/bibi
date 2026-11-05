import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

describe("cross-organization isolation: line amounts and issues", () => {
  it("refuses another organization's order and answers for one's own", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { orderId } = await seedProgram({ client: a });

    for (const name of ["line_amounts", "line_issues"] as const) {
      const refused = await call({ client: b, name, args: { orderId } });
      expect(refused.data.code, name).toBe("NOT_FOUND");
      const mine = await call({ client: a, name, args: { orderId } });
      expect(mine.isError, JSON.stringify(mine.data)).toBe(false);
    }
    const issues = await call({ client: a, name: "line_issues", args: { orderId } });
    // The seeded line is the order's only hold: it never clashes with itself.
    expect(issues.data.lines).toEqual([]);
  });
});
