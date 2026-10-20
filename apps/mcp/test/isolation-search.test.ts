import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Hit = { entityType: string; entityId: string };

const WORD = "Zyxwvuq";

async function seedItem({ organizationId }: { organizationId: string }) {
  const client = await connect({ context: testContext({ organizationId }) });
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Dish" },
  });
  const item = await call({
    client,
    name: "item_create",
    args: { entityTypeId: type.data.id, name: `${WORD} casserole` },
  });
  expect(item.isError, JSON.stringify(item.data)).toBe(false);
  return { client, itemId: item.data.id as string };
}

describe("cross-organization isolation: search", () => {
  it("never returns another organization's records", async () => {
    const orgA = `org_search_a_${Date.now()}`;
    const { client: a, itemId } = await seedItem({ organizationId: orgA });
    const b = await connect({ context: testContext() });

    const own = await call({ client: a, name: "search", args: { query: WORD } });
    expect(own.data.hits.map((hit: Hit) => hit.entityId)).toContain(itemId);

    const foreign = await call({ client: b, name: "search", args: { query: WORD } });
    expect(foreign.isError, JSON.stringify(foreign.data)).toBe(false);
    expect(foreign.data.hits).toEqual([]);
    const typed = await call({
      client: b,
      name: "search",
      args: { query: WORD, entityTypes: ["item"] },
    });
    expect(typed.data.hits).toEqual([]);
  });

  it("drops hits for a resource the caller may not read", async () => {
    const organizationId = `org_search_perm_${Date.now()}`;
    const { itemId } = await seedItem({ organizationId });
    const withRead = await connect({
      context: testContext({ organizationId, permissions: { item: ["read"] } }),
    });
    const withoutRead = await connect({
      context: testContext({ organizationId, permissions: { venue: ["read"] } }),
    });
    const visible = await call({ client: withRead, name: "search", args: { query: WORD } });
    expect(visible.data.hits.map((hit: Hit) => hit.entityId)).toContain(itemId);
    const hidden = await call({ client: withoutRead, name: "search", args: { query: WORD } });
    expect(hidden.isError, JSON.stringify(hidden.data)).toBe(false);
    expect(hidden.data.hits.map((hit: Hit) => hit.entityId)).not.toContain(itemId);
  });
});
