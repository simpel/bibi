import { mcpTool, text } from "../../tools/meta";

export const responsibilityMcpTools = [
  mcpTool({ operation: "responsibility.list" }),
  mcpTool({ operation: "responsibility.get" }),
  mcpTool({
    operation: "responsibility.create",
    summary: ({ input }) => `Define responsibility "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "responsibility.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update responsibility ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "responsibility.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive responsibility ${text({ value: input.id })}`,
  }),
];
