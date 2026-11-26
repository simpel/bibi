import { mcpTool, text } from "../../tools/meta";

export const diningRoomMcpTools = [
  mcpTool({ operation: "diningRoom.list" }),
  mcpTool({ operation: "diningRoom.get" }),
  mcpTool({
    operation: "diningRoom.set",
    idempotent: true,
    summary: ({ input }) =>
      `Set up room ${text({ value: input.itemId })} for table booking at /${text({ value: input.slug })}`,
  }),
];
