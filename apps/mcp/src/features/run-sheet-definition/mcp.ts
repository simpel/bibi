import { mcpTool, text } from "../../tools/meta";

export const runSheetDefinitionMcpTools = [
  mcpTool({ operation: "runSheetDefinition.list" }),
  mcpTool({ operation: "runSheetDefinition.get" }),
  mcpTool({
    operation: "runSheetDefinition.create",
    summary: ({ input }) => `Define run sheet "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "runSheetDefinition.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update run sheet ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "runSheetDefinition.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive run sheet ${text({ value: input.id })}`,
  }),
];
