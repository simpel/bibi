import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
const BLOCK = `mutation($i: OccupancyCreateInput!) { occupancyCreate(input: $i) { id } }`;

describe("occupancy graph (ADR 0022)", () => {
  it("resolves item { occupancies } and maps an overlap to CONFLICT", async () => {
    const gql = createClient({ context: testContext() });
    const type = await gql({
      query: TYPE,
      variables: { i: { base: "ITEM", name: "Room", behaviours: ["BOOKABLE"] } },
    });
    const entityTypeId = type.body.data.entityTypeCreate.id;
    const item = await gql({ query: ITEM, variables: { i: { entityTypeId, name: "Älvsalen" } } });
    const itemId = item.body.data.itemCreate.id;
    const block = {
      itemId,
      type: "MAINTENANCE",
      startsAt: "2026-11-01T08:00:00.000Z",
      endsAt: "2026-11-01T10:00:00.000Z",
    };
    const created = await gql({ query: BLOCK, variables: { i: block } });
    expect(created.body.errors).toBeUndefined();
    const clash = await gql({ query: BLOCK, variables: { i: { ...block, type: "INTERNAL" } } });
    expect(clash.body.errors?.[0]?.extensions?.code).toBe("CONFLICT");
    const res = await gql({
      query: `query($id: String!) { item(id: $id) { occupancies { type startsAt endsAt } } }`,
      variables: { id: itemId },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.item.occupancies).toEqual([
      { type: "MAINTENANCE", startsAt: block.startsAt, endsAt: block.endsAt },
    ]);
  });
});
