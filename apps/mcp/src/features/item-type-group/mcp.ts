import { mcpTool, text } from "../../tools/meta";

export const itemTypeGroupMcpTools = [
  mcpTool({ operation: "itemTypeGroup.list" }),
  mcpTool({ operation: "itemTypeGroup.get" }),
  mcpTool({
    operation: "itemTypeGroup.create",
    summary: ({ input }) => `Create item type group "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "itemTypeGroup.update",
    idempotent: true,
    summary: ({ input }) =>
      `Rename item type group ${text({ value: input.id })} to "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "itemTypeGroup.reorder",
    idempotent: true,
    summary: ({ input }) =>
      `Reorder item type groups: ${Array.isArray(input.ids) ? input.ids.join(", ") : ""}`,
  }),
  mcpTool({
    operation: "itemTypeGroup.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive item type group ${text({ value: input.id })}`,
  }),
];
