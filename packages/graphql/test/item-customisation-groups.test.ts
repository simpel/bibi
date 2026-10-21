import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const CREATE_TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CREATE_ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
const GROUPS = "customisationGroups { name minPick maxPick options }";
const UPDATE_ITEM = `mutation($i: ItemUpdateInput!) { itemUpdate(input: $i) { ${GROUPS} } }`;

describe("item customisation groups", () => {
  it("creates and edits an item with priced options and validated limits", async () => {
    const gql = createClient({ context: testContext() });
    const type = await gql({
      query: CREATE_TYPE,
      variables: { i: { base: "ITEM", name: "Meal", capabilities: ["CUSTOMISATIONS"] } },
    });
    const entityTypeId = type.body.data.entityTypeCreate.id;
    const cod = await gql({ query: CREATE_ITEM, variables: { i: { entityTypeId, name: "Cod" } } });
    const codId = cod.body.data.itemCreate.id;
    const options = [{ itemId: codId, priceEffect: "EXTRA" }];
    const group = { name: "Main course", minPick: 1, maxPick: 1, options };
    const created = await gql({
      query: CREATE_ITEM,
      variables: {
        i: {
          entityTypeId,
          name: "Lunch",
          customisationGroups: [group],
        },
      },
    });
    expect(created.body.errors).toBeUndefined();
    const id = created.body.data.itemCreate.id;
    const optional = { ...group, minPick: 0 };
    const edited = await gql({
      query: UPDATE_ITEM,
      variables: { i: { id, customisationGroups: [optional] } },
    });
    expect(edited.body.errors).toBeUndefined();
    expect(edited.body.data.itemUpdate.customisationGroups).toEqual([optional]);
    const tooMany = await gql({
      query: UPDATE_ITEM,
      variables: { i: { id, customisationGroups: [{ ...group, maxPick: 2 }] } },
    });
    expect(tooMany.body.errors?.[0]?.extensions?.code).toBe("VALIDATION");
  });
});
