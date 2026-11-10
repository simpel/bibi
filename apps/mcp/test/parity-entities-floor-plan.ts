import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const ELEMENT = `{ id kindId xCm yCm rotationDeg widthCm depthCm seats seatsTop seatsRight seatsBottom
  seatsLeft label shape fixed keepClearCm effectiveWidthCm effectiveDepthCm effectiveAround
  effectiveSides { top right bottom left } seatCount }`;
const SETUP_CAPACITY = "{ setupId seatCount capacity effectiveCapacity capacitySource }";
const LAYOUT_SUMMARY = `{ id setupId name version seatCount elements ${ELEMENT} }`;
const PLAN_SHAPE = "widthCm depthCm outline minAisleCm";
const OUTLINE = [
  [0, 0],
  [800, 0],
  [800, 600],
  [0, 600],
];

const floorElementKind = byId({
  name: "floorElementKind",
  field: "floorElementKind",
  list: "floor-element-kinds",
  createTool: "floorElementKind_create",
  args: { name: "Parity table", shape: "RECT", widthCm: 180, depthCm: 80, seatsTop: 3 },
});

/** The plan is read through its item, like hours (no id of its own). */
const floorPlan: ParityEntity = {
  name: "floorPlan",
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "floorPlan_save",
      args: {
        itemId: made.item.id,
        widthCm: 800,
        depthCm: 600,
        outline: OUTLINE,
        minAisleCm: 90,
        expectedVersion: 0,
        elements: [],
      },
    }),
  viaMcp: ({ mcp, created }) =>
    tool({ mcp, name: "floorPlan_get", args: { itemId: created.itemId } }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({ path: `/items/${created.itemId}/floor-plan` }),
  viaGraph: async ({ context, created }) => {
    const query = `query($id: String!) { floorPlan(itemId: $id) {
      id itemId version ${PLAN_SHAPE} elements ${ELEMENT} setups ${SETUP_CAPACITY} layouts ${LAYOUT_SUMMARY} } }`;
    return (await gqlQuery({ context, query, variables: { id: created.itemId } })).floorPlan;
  },
};

const setupLayout: ParityEntity = {
  name: "setupLayout",
  create: async ({ mcp, made }) => {
    const layout = await tool({
      mcp,
      name: "setupLayout_create",
      args: { itemId: made.item.id, setupId: made.setup.id, name: "Parity layout" },
    });
    return tool({
      mcp,
      name: "setupLayout_save",
      args: {
        id: layout.id,
        expectedVersion: layout.version,
        note: "Parity layout",
        capacity: 60,
        elements: [],
      },
    });
  },
  viaMcp: ({ mcp, created }) => tool({ mcp, name: "setupLayout_get", args: { id: created.id } }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({ path: `/setup-layouts/${created.id}` }),
  viaGraph: async ({ context, created }) => {
    const selection = `id itemId setupId name seatCount capacity effectiveCapacity capacitySource
        version note elements ${ELEMENT} plan { ${PLAN_SHAPE} elements ${ELEMENT} }
        issues { kind elementIds }`;
    const query = `query($id: String!) { setupLayout(id: $id) { ${selection} } }`;
    const variables = { id: created.id };
    return (await gqlQuery({ context, query, variables })).setupLayout;
  },
};

/** Floor element library, an item's floor plan and a setup's layout (ADR 0099). */
export function floorPlanEntities(): ParityEntity[] {
  return [floorElementKind, floorPlan, setupLayout];
}
