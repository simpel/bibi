import { mcpTool, text } from "../../tools/meta";

export const fieldDefinitionMcpTools = [
  mcpTool({ operation: "fieldDefinition.list" }),
  mcpTool({ operation: "fieldDefinition.get" }),
  mcpTool({
    operation: "fieldDefinition.create",
    summary: ({ input }) =>
      `Add ${text({ value: input.kind })} field "${text({ value: input.name })}" to type ${text({ value: input.entityTypeId })}`,
  }),
  mcpTool({
    operation: "fieldDefinition.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update field ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "fieldDefinition.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive field ${text({ value: input.id })}`,
  }),
];
