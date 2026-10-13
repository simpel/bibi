import { mcpTool, text } from "../../tools/meta";

export const roomMcpTools = [
  mcpTool({ operation: "room.list" }),
  mcpTool({ operation: "room.get" }),
  mcpTool({
    operation: "room.create",
    summary: ({ input }) =>
      `Create room "${text({ value: input.name })}" in venue ${text({ value: input.venueId })}`,
  }),
  mcpTool({
    operation: "room.update",
    idempotent: true,
    summary: ({ input }) => `Update room ${text({ value: input.id })}: ${Object.keys(input).filter((key) => key !== "id").join(", ")}`,
  }),
  mcpTool({
    operation: "room.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive room ${text({ value: input.id })}`,
  }),
];
