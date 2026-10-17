import { mcpTool, text } from "../../tools/meta";

export const userPreferenceMcpTools = [
  mcpTool({ operation: "userPreference.list" }),
  mcpTool({
    operation: "userPreference.set",
    idempotent: true,
    summary: ({ input }) => `Save your preference ${text({ value: input.key })}`,
  }),
];
