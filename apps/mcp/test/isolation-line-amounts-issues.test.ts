import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

describe("cross-organization isolation: line amounts and issues", () => {
  it("refuses another organization's ticket and answers for one's own", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { ticketId } = await seedProgram({ client: a });

    for (const name of ["line_amounts", "line_issues"] as const) {
      const refused = await call({ client: b, name, args: { ticketId } });
      expect(refused.data.code, name).toBe("NOT_FOUND");
      const mine = await call({ client: a, name, args: { ticketId } });
      expect(mine.isError, JSON.stringify(mine.data)).toBe(false);
    }
    const issues = await call({ client: a, name: "line_issues", args: { ticketId } });
    // The seeded line is the ticket's only hold: it never clashes with itself.
    expect(issues.data.lines).toEqual([]);
  });
});
