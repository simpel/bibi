import { mcpTool, text } from "../../tools/meta";

export const userPreferenceMcpTools = [
  mcpTool({ operation: "userPreference.list" }),
  mcpTool({
    operation: "userPreference.set",
    idempotent: true,
    summary: ({ input }) => `Save your preference ${text({ value: input.key })}`,
  }),
  mcpTool({ operation: "userSettings.get" }),
  mcpTool({
    operation: "userSettings.update",
    idempotent: true,
    summary: ({ input }) => `Set your first setup to ${text({ value: input.onboardingStatus })}`,
  }),
];
