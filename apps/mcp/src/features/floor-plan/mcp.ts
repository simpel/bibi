import { mcpTool, text } from "../../tools/meta";

export const floorPlanMcpTools = [
  mcpTool({ operation: "floorElementKind.list" }),
  mcpTool({ operation: "floorElementKind.get" }),
  mcpTool({
    operation: "floorElementKind.create",
    summary: ({ input }) => `Create floor element "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "floorElementKind.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update floor element ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "floorElementKind.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive floor element ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "floorElementKind.importTemplate",
    summary: ({ input }) => `Import floor element library "${text({ value: input.template })}"`,
  }),
  mcpTool({ operation: "floorPlan.get" }),
  mcpTool({
    operation: "floorPlan.save",
    idempotent: true,
    summary: ({ input }) => `Save floor plan of item ${text({ value: input.itemId })}`,
  }),
  mcpTool({ operation: "setupLayout.get" }),
  mcpTool({
    operation: "setupLayout.create",
    summary: ({ input }) =>
      `Create layout "${text({ value: input.name })}" for item ${text({ value: input.itemId })}`,
  }),
  mcpTool({
    operation: "setupLayout.save",
    idempotent: true,
    summary: ({ input }) => `Save layout ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "setupLayout.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive layout ${text({ value: input.id })}`,
  }),
];
