import { createCoreOperations } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { fakeEmbed } from "./fake-embed";
import { call, connect, testContext } from "./helpers";

describe("MCP tools", () => {
  it("lists one tool per operation plus the generic and approval tools", async () => {
    const client = await connect({ context: testContext() });
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "venue_create",
        "venue_list",
        "item_archive",
        "search",
        "graphql_schema",
        "graphql_query",
        "approval_confirm",
      ]),
    );
    const operations = createCoreOperations({ embed: fakeEmbed }).length;
    expect(tools.length).toBe(operations + 3);
  });

  it("describes tools for LLMs and sets annotations", async () => {
    const client = await connect({ context: testContext() });
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    expect(byName.get("venue_list")?.annotations?.readOnlyHint).toBe(true);
    expect(byName.get("venue_archive")?.annotations?.destructiveHint).toBe(true);
    expect(byName.get("venue_create")?.annotations?.destructiveHint).toBe(false);
    expect(byName.get("venue_create")?.description).toContain("venue:write");
    expect(byName.get("venue_create")?.description).toContain("approval_required");
    expect(byName.get("venue_get")?.inputSchema.required).toContain("id");
  });

  it("flags untrusted-output tools in _meta", async () => {
    const client = await connect({ context: testContext() });
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    expect(byName.get("inboundEmail_get")?._meta?.["okazi/untrustedOutput"]).toBe(true);
    expect(byName.get("venue_list")?._meta).toBeUndefined();
  });

  it("hides approval_confirm from the AI actor", async () => {
    const actor = { type: "ai" as const, userId: "user_1", conversationId: "conv_1" };
    const client = await connect({ context: testContext({ actor }) });
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).not.toContain("approval_confirm");
    const refused = await call({ client, name: "approval_confirm", args: { approvalToken: "x" } });
    expect(refused.isError).toBe(true);
  });

  it("creates and reads as a user; results are structured JSON", async () => {
    const client = await connect({ context: testContext() });
    const created = await call({ client, name: "venue_create", args: { name: "World of Volvo" } });
    expect(created.isError).toBe(false);
    expect(created.data).toMatchObject({ name: "World of Volvo", status: "ACTIVE" });
    expect(typeof created.data.createdAt).toBe("string");
    const got = await call({ client, name: "venue_get", args: { id: created.data.id } });
    expect(got.data).toEqual(created.data);
    const list = await call({ client, name: "venue_list" });
    expect(list.data.items).toHaveLength(1);
  });

  it("maps validation, permission and not-found errors via toMcpError", async () => {
    const owner = await connect({ context: testContext() });
    const invalid = await call({ client: owner, name: "venue_create", args: { name: "" } });
    expect(invalid).toMatchObject({ isError: true, data: { code: "VALIDATION" } });
    const missing = await call({ client: owner, name: "venue_get", args: { id: "nope" } });
    expect(missing.data.code).toBe("NOT_FOUND");
    const viewer = await connect({ context: testContext({ access: "read" }) });
    const denied = await call({ client: viewer, name: "venue_create", args: { name: "X" } });
    expect(denied.data.code).toBe("FORBIDDEN");
  });
});
