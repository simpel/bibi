import { mcpTool, text } from "../../tools/meta";

export const vocabularyMcpTools = [
  mcpTool({ operation: "vocabulary.list" }),
  mcpTool({ operation: "vocabulary.get" }),
  mcpTool({
    operation: "vocabulary.create",
    summary: ({ input }) => `Create list "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "vocabulary.update",
    idempotent: true,
    summary: ({ input }) =>
      `Rename list ${text({ value: input.id })} to "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "vocabulary.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive list ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "vocabulary.importTemplate",
    idempotent: true,
    summary: ({ input }) => `Import list template ${text({ value: input.template })}`,
  }),
  mcpTool({
    operation: "vocabulary.addValue",
    summary: ({ input }) =>
      `Add value "${text({ value: input.name })}" to list ${text({ value: input.vocabularyId })}`,
  }),
  mcpTool({
    operation: "vocabulary.updateValue",
    idempotent: true,
    summary: ({ input }) => `Update list value ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "vocabulary.archiveValue",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive list value ${text({ value: input.id })}`,
  }),
];
