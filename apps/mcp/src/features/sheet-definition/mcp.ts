import { mcpTool, text } from "../../tools/meta";

export const sheetDefinitionMcpTools = [
  mcpTool({ operation: "sheetDefinition.list" }),
  mcpTool({ operation: "sheetDefinition.get" }),
  mcpTool({
    operation: "sheetDefinition.create",
    summary: ({ input }) => `Define sheet "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "sheetDefinition.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update sheet ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "sheetDefinition.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive sheet ${text({ value: input.id })}`,
  }),
];
