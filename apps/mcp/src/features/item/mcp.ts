import { hoursSummary, mcpTool, text } from "../../tools/meta";

export const itemMcpTools = [
  mcpTool({ operation: "item.list" }),
  mcpTool({ operation: "item.get" }),
  mcpTool({ operation: "item.resolve" }),
  mcpTool({ operation: "item.freeUnits" }),
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
    operation: "item.saveAsBundle",
    summary: ({ input }) =>
      `Save bundle "${text({ value: input.name })}" for customer ${text({ value: input.customerId })}`,
  }),
  mcpTool({ operation: "itemHours.get" }),
  mcpTool({
    operation: "itemHours.set",
    idempotent: true,
    summary: ({ input }) => hoursSummary({ input, owner: "item" }),
  }),
];
