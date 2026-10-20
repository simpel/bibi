import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const CREATE_TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CREATE_ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;

describe("item parts", () => {
  it("assembles a bundle and resolves its parts", async () => {
    const gql = createClient({ context: testContext() });
    const type = await gql({
      query: CREATE_TYPE,
      variables: { i: { base: "ITEM", name: "Bundle", capabilities: ["BUNDLE"] } },
    });
    const entityTypeId = type.body.data.entityTypeCreate.id;
    const part = await gql({
      query: CREATE_ITEM,
      variables: { i: { entityTypeId, name: "Fika" } },
    });
    const partId = part.body.data.itemCreate.id;
    const created = await gql({
      query: CREATE_ITEM,
      variables: {
        i: { entityTypeId, name: "Day", parts: [{ itemId: partId, offsetMinutes: 90 }] },
      },
    });
    expect(created.body.errors).toBeUndefined();
    const res = await gql({
      query: `query($id: String!) { item(id: $id) {
        parts { quantity offsetMinutes durationMinutes required item { name } }
      } }`,
      variables: { id: created.body.data.itemCreate.id },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.item.parts).toEqual([
      {
        quantity: 1,
        offsetMinutes: 90,
        durationMinutes: null,
        required: true,
        item: { name: "Fika" },
      },
    ]);
    const cycle = await gql({
      query: `mutation($i: ItemUpdateInput!) { itemUpdate(input: $i) { id } }`,
      variables: { i: { id: partId, parts: [{ itemId: created.body.data.itemCreate.id }] } },
    });
    expect(cycle.body.errors?.[0]?.extensions?.code).toBe("VALIDATION");
  });
});
