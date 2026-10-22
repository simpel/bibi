import { mcpTool, text } from "../../tools/meta";

const dayCount = ({ value }: { value: unknown }) => (Array.isArray(value) ? value.length : 0);

export const profileMcpTools = [
  mcpTool({ operation: "profile.get" }),
  mcpTool({
    operation: "profile.update",
    idempotent: true,
    summary: ({ input }) =>
      `Save your profile as ${text({ value: input.firstName })} ${text({ value: input.lastName })}`,
  }),
  mcpTool({ operation: "workingHours.get" }),
  mcpTool({
    operation: "workingHours.set",
    idempotent: true,
    summary: ({ input }) => `Set your working hours to ${dayCount({ value: input.days })} days`,
  }),
];
