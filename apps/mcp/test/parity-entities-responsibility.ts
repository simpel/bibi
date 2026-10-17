import { byId, type ParityEntity, tool } from "./parity-entities";

/** A responsibility covering the parity type, defaulting to the seeded member. */
export const responsibility: ParityEntity = {
  ...byId({
    name: "responsibility",
    field: "responsibility",
    list: "responsibilities",
    createTool: "",
    args: {},
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "responsibility_create",
      args: {
        name: "Parity kitchen",
        entityTypeIds: [made.entityType.id],
        defaultAssigneeId: made.memberSeed.userId,
      },
    }),
};
