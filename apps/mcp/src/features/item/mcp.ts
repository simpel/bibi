import { mcpTool, text } from "../../tools/meta";

export const itemMcpTools = [
  mcpTool({ operation: "item.list" }),
  mcpTool({ operation: "item.get" }),
  mcpTool({
    operation: "item.create",
    summary: ({ input }) =>
      `Create item "${text({ value: input.name })}" of type ${text({ value: input.entityTypeId })}`,
  }),
  mcpTool({
    operation: "item.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update item ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "item.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive item ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "item.saveAsPackage",
    summary: ({ input }) =>
      `Save package "${text({ value: input.name })}" for customer ${text({ value: input.customerId })}`,
  }),
];
