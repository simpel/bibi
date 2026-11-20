import { byId, type ParityEntity, tool } from "./parity-entities";

/** A comment (ADR 0115) on the parity line. */
export const comment = (): ParityEntity => ({
  ...byId({ name: "comment", field: "comment", list: "comments", createTool: "", args: {} }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "comment_create",
      args: { orderId: made.order.id, lineId: made.line.id, body: "Parity comment" },
    }),
});
