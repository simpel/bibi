import { mcpTool, text } from "../../tools/meta";

export const oauthGrantMcpTools = [
  mcpTool({ operation: "oauthGrant.list" }),
  mcpTool({
    operation: "oauthGrant.revoke",
    destructive: true,
    summary: ({ input }) => `Disconnect client ${text({ value: input.clientId })}`,
  }),
];
