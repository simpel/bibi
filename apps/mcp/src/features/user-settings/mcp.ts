import { mcpTool, text } from "../../tools/meta";

export const userSettingsMcpTools = [
  mcpTool({ operation: "userSettings.get" }),
  mcpTool({
    operation: "userSettings.update",
    idempotent: true,
    summary: ({ input }) =>
      `Set your date format to ${text({ value: input.dateFormat ?? "the default" })} and clock to ${text({ value: input.clockFormat ?? "the default" })}`,
  }),
];
