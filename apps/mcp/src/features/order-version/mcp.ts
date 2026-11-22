import { mcpTool, text } from "../../tools/meta";

export const orderVersionMcpTools = [
  mcpTool({ operation: "orderVersion.list" }),
  mcpTool({ operation: "orderVersion.get" }),
  mcpTool({
    operation: "orderVersion.name",
    idempotent: true,
    summary: ({ input }) =>
      input.name === null
        ? `Remove the name of order version ${text({ value: input.id })}`
        : `Name order version ${text({ value: input.id })} "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "orderVersion.restore",
    destructive: true,
    summary: ({ input }) =>
      `Restore the order to version ${text({ value: input.id })}: lines added since are removed ` +
      "and the rest set back",
  }),
];
