import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const ELEMENT = `{ id kindId xCm yCm rotationDeg widthCm depthCm seats seatsTop seatsRight seatsBottom
  seatsLeft label shape fixed keepClearCm effectiveWidthCm effectiveDepthCm effectiveAround
  effectiveSides { top right bottom left } seatCount }`;
const LAYOUT_SUMMARY = "{ setupId layoutId seatCount capacity effectiveCapacity capacitySource }";
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

/** The plan and the layout are read through their item and setup, like hours (no id of their own). */
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
      id itemId version ${PLAN_SHAPE} elements ${ELEMENT} layouts ${LAYOUT_SUMMARY} } }`;
    return (await gqlQuery({ context, query, variables: { id: created.itemId } })).floorPlan;
  },
};

const setupLayout: ParityEntity = {
  name: "setupLayout",
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "setupLayout_save",
      args: {
        itemId: made.item.id,
        setupId: made.setup.id,
        expectedVersion: 0,
        note: "Parity layout",
        capacity: 60,
        elements: [],
      },
    }),
  viaMcp: ({ mcp, created }) =>
    tool({
      mcp,
      name: "setupLayout_get",
      args: { itemId: created.itemId, setupId: created.setupId },
    }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({
      path: `/items/${created.itemId}/layouts/${created.setupId}`,
    }),
  viaGraph: async ({ context, created }) => {
    const selection = `itemId setupId layoutId seatCount capacity effectiveCapacity capacitySource
        version note elements ${ELEMENT} plan { ${PLAN_SHAPE} elements ${ELEMENT} }
        issues { kind elementIds }`;
    const query = `query($itemId: String!, $setupId: String!) { setupLayout(itemId: $itemId, setupId: $setupId) { ${selection} } }`;
    const variables = { itemId: created.itemId, setupId: created.setupId };
    return (await gqlQuery({ context, query, variables })).setupLayout;
  },
};

/** Floor element library, an item's floor plan and a setup's layout (ADR 0099). */
export function floorPlanEntities(): ParityEntity[] {
  return [floorElementKind, floorPlan, setupLayout];
}
