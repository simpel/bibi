import { byId, type ParityEntity, tool } from "./parity-entities";
import { sheetDefinition } from "./parity-entities-sheet";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const FIELD =
  "{ id entityTypeId key name kind required vocabularyId options position status createdAt updatedAt createdBy }";
const VALUE = "{ id vocabularyId name position }";

type Value = { id: string; vocabularyId: string };

const findValue = ({ list, id }: { list: { values: Value[] }; id: string }) =>
  list.values.find((value) => value.id === id);

/** A list value is read through its list (`vocabulary.get`) on every surface. */
const vocabularyValue: ParityEntity = {
  name: "vocabularyValue",
  create: async ({ mcp, made }) => {
    const args = { vocabularyId: made.vocabulary.id, name: "Ledarhund" };
    const list = await tool({ mcp, name: "vocabulary_addValue", args });
    return list.values.find((value: { name: string }) => value.name === "Ledarhund");
  },
  viaMcp: async ({ mcp, created }) =>
    findValue({
      list: await tool({ mcp, name: "vocabulary_get", args: { id: created.vocabularyId } }),
      id: created.id,
    }),
  viaRest: async ({ context, created }) =>
    findValue({
      list: await createRestClient({ context }).get({
        path: `/vocabularies/${created.vocabularyId}`,
      }),
      id: created.id,
    }),
  viaGraph: async ({ context, created }) => {
    const query = `query($id: String!) { vocabulary(id: $id) { values ${VALUE} } }`;
    const data = await gqlQuery({ context, query, variables: { id: created.vocabularyId } });
    return findValue({ list: data.vocabulary, id: created.id });
  },
};

const entityType = byId({
  name: "entityType",
  field: "entityType",
  list: "entity-types",
  createTool: "entityType_create",
  args: { base: "ITEM", name: "Parity room", behaviours: ["BOOKABLE", "SETUPS", "PRICED"] },
  nested: { fields: FIELD, behaviours: "" },
});
const fieldDefinition: ParityEntity = {
  ...byId({
    name: "fieldDefinition",
    field: "fieldDefinition",
    list: "field-definitions",
    createTool: "",
    args: {},
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "fieldDefinition_create",
      args: {
        entityTypeId: made.entityType.id,
        name: "Style",
        kind: "MULTI_CHOICE",
        options: ["Light", "Dark"],
      },
    }),
};
const vocabulary = byId({
  name: "vocabulary",
  field: "vocabulary",
  list: "vocabularies",
  createTool: "vocabulary_create",
  args: { name: "Parity list", values: ["Wheelchair", "Hearing loop"] },
  nested: { values: VALUE },
});
const setup = byId({
  name: "setup",
  field: "setup",
  list: "setups",
  createTool: "setup_create",
  args: { name: "Parity theatre", changeoverMinutes: 15 },
});
const item: ParityEntity = {
  ...byId({
    name: "item",
    field: "item",
    list: "items",
    createTool: "",
    args: {},
    nested: {
      setups: "{ setupId capacity }",
      components: "{ itemId quantity offsetMinutes durationMinutes required }",
    },
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "item_create",
      args: {
        entityTypeId: made.entityType.id,
        venueId: made.venue.id,
        name: "Parity Room",
        fields: { style: ["Light"] },
        priceMinor: 190_000,
        priceUnit: "PER_HOUR",
        setups: [{ setupId: made.setup.id, capacity: 70 }],
      },
    }),
};

/** A maintenance block on the (bookable) item (ADR 0022). */
const occupancy: ParityEntity = {
  ...byId({ name: "occupancy", field: "occupancy", list: "occupancies", createTool: "", args: {} }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "occupancy_create",
      args: {
        itemId: made.item.id,
        type: "MAINTENANCE",
        startsAt: "2026-11-02T07:00:00.000Z",
        endsAt: "2026-11-02T09:00:00.000Z",
        note: "Projector service",
      },
    }),
};

/**
 * The configurable domain (ADR 0021): types, fields, lists, setups, sheet definitions, items and
 * their occupancy.
 */
export function configurationEntities(): ParityEntity[] {
  return [
    entityType,
    fieldDefinition,
    vocabulary,
    vocabularyValue,
    setup,
    sheetDefinition,
    item,
    occupancy,
  ];
}
