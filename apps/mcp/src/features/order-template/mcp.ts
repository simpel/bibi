import { mcpTool, text } from "../../tools/meta";

export const orderTemplateMcpTools = [
  mcpTool({ operation: "orderTemplate.list" }),
  mcpTool({ operation: "orderTemplate.get" }),
  mcpTool({
    operation: "orderTemplate.create",
    summary: ({ input }) => `Create predefined order "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "orderTemplate.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update predefined order ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "orderTemplate.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive predefined order ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "orderTemplate.restore",
    destructive: false,
    idempotent: true,
    summary: ({ input }) => `Restore predefined order ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "orderTemplate.delete",
    destructive: true,
    summary: ({ input }) => `Delete predefined order ${text({ value: input.id })} permanently`,
  }),
];
