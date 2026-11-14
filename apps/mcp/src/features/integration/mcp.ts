import { mcpTool, text } from "../../tools/meta";

export const integrationMcpTools = [
  mcpTool({ operation: "integration.list" }),
  mcpTool({
    operation: "integration.connect",
    idempotent: true,
    summary: ({ input }) => `Connect the organization to ${text({ value: input.provider })}`,
  }),
  mcpTool({
    operation: "integration.checkSetup",
    idempotent: true,
    summary: ({ input }) =>
      `Check the accounts Bibi books to in ${text({ value: input.provider })}`,
  }),
  mcpTool({
    operation: "integration.disconnect",
    destructive: true,
    summary: ({ input }) => `Disconnect the organization from ${text({ value: input.provider })}`,
  }),
];
