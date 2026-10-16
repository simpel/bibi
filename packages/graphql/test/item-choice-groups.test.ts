import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const CREATE_TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CREATE_ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
const GROUPS = "choiceGroups { name minPick maxPick itemIds }";
const UPDATE_ITEM = `mutation($i: ItemUpdateInput!) { itemUpdate(input: $i) { ${GROUPS} } }`;

describe("item choice groups", () => {
  it("creates and edits a package with options and validated limits", async () => {
    const gql = createClient({ context: testContext() });
    const type = await gql({
      query: CREATE_TYPE,
      variables: { i: { base: "ITEM", name: "Meal", behaviours: ["COMPOSABLE", "CHOICES"] } },
    });
    const entityTypeId = type.body.data.entityTypeCreate.id;
    const cod = await gql({ query: CREATE_ITEM, variables: { i: { entityTypeId, name: "Cod" } } });
    const codId = cod.body.data.itemCreate.id;
    const group = { name: "Main course", minPick: 1, maxPick: 1, itemIds: [codId] };
    const created = await gql({
      query: CREATE_ITEM,
      variables: {
        i: { entityTypeId, name: "Lunch", components: [{ itemId: codId }], choiceGroups: [group] },
      },
    });
    expect(created.body.errors).toBeUndefined();
    const id = created.body.data.itemCreate.id;
    const optional = { ...group, minPick: 0 };
    const edited = await gql({
      query: UPDATE_ITEM,
      variables: { i: { id, choiceGroups: [optional] } },
    });
    expect(edited.body.data.itemUpdate.choiceGroups).toEqual([optional]);
    const tooMany = await gql({
      query: UPDATE_ITEM,
      variables: { i: { id, choiceGroups: [{ ...group, maxPick: 2 }] } },
    });
    expect(tooMany.body.errors?.[0]?.extensions?.code).toBe("VALIDATION");
  });
});
