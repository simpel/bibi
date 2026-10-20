import { describe, expect, it } from "vitest";
import { createClient, createItemType, testContext } from "./helpers";

const SEED = `mutation($v: VenueCreateInput!) { venueCreate(input: $v) { id } }`;
const SEED_ITEM = `mutation($r: ItemCreateInput!) { itemCreate(input: $r) { id } }`;

const IMPORT =
  "mutation($i: VocabularyImportTemplateInput!) { vocabularyImportTemplate(input: $i) { id name values { name position } } }";

describe("graph traversal", () => {
  it("resolves venues { items } and item { venue }, hiding archived items", async () => {
    const gql = createClient({ context: testContext() });
    const v = await gql({ query: SEED, variables: { v: { name: "The Farm" } } });
    const venueId = v.body.data.venueCreate.id;
    const entityTypeId = await createItemType({ gql });
    const ids: string[] = [];
    for (const name of ["Great hall", "Studio", "Kitchen"]) {
      const r = await gql({ query: SEED_ITEM, variables: { r: { entityTypeId, venueId, name } } });
      ids.push(r.body.data.itemCreate.id);
    }
    const archive = `mutation($i: ItemArchiveInput!) { itemArchive(input: $i) { id } }`;
    await gql({ query: archive, variables: { i: { id: ids[2] } } });

    const nested = await gql({
      query: "{ venues { items { name items { name venue { name } } } } }",
    });
    expect(nested.body.errors).toBeUndefined();
    const [venue] = nested.body.data.venues.items;
    expect(venue.items.map((r: { name: string }) => r.name)).toEqual(["Great hall", "Studio"]);
    expect(venue.items[0].venue.name).toBe("The Farm");
  });

  it("exposes item fields JSON, setups and the entity type with its fields", async () => {
    const gql = createClient({ context: testContext() });
    const entityTypeId = await createItemType({ gql });
    const field = `mutation($i: FieldDefinitionCreateInput!) { fieldDefinitionCreate(input: $i) { id } }`;
    await gql({
      query: field,
      variables: { i: { entityTypeId, name: "Yta", key: "area", kind: "NUMBER" } },
    });
    const setup = await gql({
      query: `mutation($i: SetupCreateInput!) { setupCreate(input: $i) { id } }`,
      variables: { i: { name: "U-bord", changeoverMinutes: 15 } },
    });
    const setupId = setup.body.data.setupCreate.id;
    const created = await gql({
      query: `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`,
      variables: {
        i: {
          entityTypeId,
          name: "Salen",
          fields: { area: 42 },
          setups: [{ setupId, capacity: 20 }],
        },
      },
    });
    expect(created.body.errors).toBeUndefined();
    const res = await gql({
      query: `query($id: String!) { item(id: $id) {
        fields setups { capacity setup { name changeoverMinutes } }
        entityType { name capabilities fields { key name kind } }
      } }`,
      variables: { id: created.body.data.itemCreate.id },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.item).toEqual({
      fields: { area: 42 },
      setups: [{ capacity: 20, setup: { name: "U-bord", changeoverMinutes: 15 } }],
      entityType: {
        name: "Konferensrum",
        capabilities: expect.arrayContaining(["BOOKABLE", "SETUPS", "PRICED"]),
        fields: [{ key: "area", name: "Yta", kind: "NUMBER" }],
      },
    });
  });

  it("imports a vocabulary template and resolves FieldDefinition.vocabulary", async () => {
    const gql = createClient({ context: testContext() });
    const imported = await gql({
      query: IMPORT,
      variables: { i: { template: "eu-14-allergens" } },
    });
    expect(imported.body.errors).toBeUndefined();
    const vocabulary = imported.body.data.vocabularyImportTemplate;
    expect(vocabulary.name).toBe("Allergens");
    expect(vocabulary.values).toHaveLength(14);
    const entityTypeId = await createItemType({ gql });
    await gql({
      query: `mutation($i: FieldDefinitionCreateInput!) { fieldDefinitionCreate(input: $i) { id } }`,
      variables: {
        i: { entityTypeId, name: "Allergens", kind: "MULTI_CHOICE", vocabularyId: vocabulary.id },
      },
    });
    const res = await gql({
      query: `query($t: String) { fieldDefinitions(entityTypeId: $t) { items { vocabulary { name values { name } } } } }`,
      variables: { t: entityTypeId },
    });
    expect(res.body.data.fieldDefinitions.items[0].vocabulary.values).toHaveLength(14);
  });
});
