import { mcpTool, text } from "../../tools/meta";

export const workOrderDefinitionMcpTools = [
  mcpTool({ operation: "workOrderDefinition.list" }),
  mcpTool({ operation: "workOrderDefinition.get" }),
  mcpTool({
    operation: "workOrderDefinition.create",
    summary: ({ input }) => `Define work order "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "workOrderDefinition.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update work order ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "workOrderDefinition.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive work order ${text({ value: input.id })}`,
  }),
];
