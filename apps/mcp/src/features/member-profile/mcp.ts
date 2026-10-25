import { mcpTool, text } from "../../tools/meta";

export const memberProfileMcpTools = [
  mcpTool({ operation: "memberProfile.list" }),
  mcpTool({ operation: "memberProfile.get" }),
  mcpTool({
    operation: "memberProfile.update",
    idempotent: true,
    summary: ({ input }) =>
      `Set schedule kind ${text({ value: input.scheduleKind })} on member ${text({ value: input.memberId })}`,
  }),
  mcpTool({
    operation: "memberProfile.setItems",
    idempotent: true,
    summary: ({ input }) =>
      `Change the staff items linked to member ${text({ value: input.memberId })}`,
  }),
];
