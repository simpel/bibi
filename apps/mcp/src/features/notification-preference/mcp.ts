import { mcpTool, text } from "../../tools/meta";

export const notificationPreferenceMcpTools = [
  mcpTool({ operation: "notificationPreference.list" }),
  mcpTool({
    operation: "notificationPreference.set",
    idempotent: true,
    summary: ({ input }) =>
      `${input.enabled ? "Turn on" : "Turn off"} ${text({ value: input.kind })} notifications`,
  }),
];
