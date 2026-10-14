import { mcpTool, text } from "../../tools/meta";

export const apiKeyMcpTools = [
  mcpTool({ operation: "apiKey.list" }),
  // Hidden from the assistant (`aiAllowed: false`) and refused for non-session callers (#88, #90).
  mcpTool({ operation: "apiKey.create" }),
  mcpTool({
    operation: "apiKey.revoke",
    destructive: true,
    summary: ({ input }) => `Revoke API key ${text({ value: input.id })}`,
  }),
];
