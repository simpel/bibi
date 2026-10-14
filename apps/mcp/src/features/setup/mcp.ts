import { mcpTool, text } from "../../tools/meta";

export const setupMcpTools = [
  mcpTool({ operation: "setup.list" }),
  mcpTool({ operation: "setup.get" }),
  mcpTool({
    operation: "setup.create",
    summary: ({ input }) => `Create setup "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "setup.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update setup ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "setup.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive setup ${text({ value: input.id })}`,
  }),
];
