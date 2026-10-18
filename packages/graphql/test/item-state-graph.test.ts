import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const STATE = `mutation($i: ItemStateCreateInput!) { itemStateCreate(input: $i) { id hold } }`;
const LIST = `query($t: String) { itemStates(entityTypeId: $t) { items { name initial transitionsTo } } }`;

describe("item state graph (ADR 0044)", () => {
  it("creates states per item type and lists them in order with their transitions", async () => {
    const gql = createClient({ context: testContext() });
    const type = await gql({
      query: TYPE,
      variables: { i: { base: "ITEM", name: "Room", behaviours: ["BOOKABLE"] } },
    });
    const entityTypeId = type.body.data.entityTypeCreate.id;
    const soft = { entityTypeId, name: "Prebooked", color: "#f59e0b", hold: "SOFT" };
    const created = await gql({ query: STATE, variables: { i: soft } });
    expect(created.body.errors).toBeUndefined();
    expect(created.body.data.itemStateCreate.hold).toBe("SOFT");
    const res = await gql({ query: LIST, variables: { t: entityTypeId } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.itemStates.items).toEqual([
      { name: "Active", initial: true, transitionsTo: [created.body.data.itemStateCreate.id] },
      { name: "Prebooked", initial: false, transitionsTo: [] },
    ]);
  });
});
