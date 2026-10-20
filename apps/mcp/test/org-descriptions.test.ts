import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

async function descriptionOf({
  client,
  name,
}: {
  client: Awaited<ReturnType<typeof connect>>;
  name: string;
}) {
  const { tools } = await client.listTools();
  return tools.find((tool) => tool.name === name)?.description ?? "";
}

describe("org-specific item tool descriptions", () => {
  it("shows each organization its own types and fields", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const room = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Konferensrum", capabilities: ["BOOKABLE"] },
    });
    await call({
      client: a,
      name: "fieldDefinition_create",
      args: { entityTypeId: room.data.id, name: "Floor", kind: "NUMBER" },
    });
    await call({
      client: b,
      name: "entityType_create",
      args: { base: "ITEM", name: "Boat", capabilities: ["PRICED"] },
    });
    const forA = await descriptionOf({ client: a, name: "item_create" });
    const forB = await descriptionOf({ client: b, name: "item_create" });
    expect(forA).toContain("Konferensrum");
    expect(forA).toContain('floor ("Floor", NUMBER');
    expect(forA).not.toContain("Boat");
    expect(forB).toContain("Boat");
    expect(forB).not.toContain("Konferensrum");
    expect(await descriptionOf({ client: a, name: "item_list" })).toContain("Konferensrum");
    expect(await descriptionOf({ client: a, name: "venue_list" })).not.toContain("Konferensrum");
  });

  it("falls back to the static description without configuration:read", async () => {
    const admin = testContext();
    const adminClient = await connect({ context: admin });
    await call({
      client: adminClient,
      name: "entityType_create",
      args: { base: "ITEM", name: "Konferensrum" },
    });
    const limited = testContext({
      organizationId: admin.organizationId,
      permissions: { item: ["read", "write"] },
    });
    const client = await connect({ context: limited });
    const description = await descriptionOf({ client, name: "item_create" });
    expect(description).toContain("item:write");
    expect(description).not.toContain("Konferensrum");
  });
});
