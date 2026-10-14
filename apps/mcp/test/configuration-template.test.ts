import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("configuration_importTemplate over MCP", () => {
  it("imports the starter pack into an empty organization, then skips everything", async () => {
    const mcp = await connect({ context: testContext() });
    const args = { template: "conference-venue" };
    const first = await call({ client: mcp, name: "configuration_importTemplate", args });
    expect(first.isError).toBe(false);
    const created = first.data.created.entityTypes.map((type: { name: string }) => type.name);
    expect(created).toContain("Conference room");
    const again = await call({ client: mcp, name: "configuration_importTemplate", args });
    expect(again.data.created.entityTypes).toEqual([]);
    expect(again.data.skipped.entityTypes).toEqual(created);
  });
});
