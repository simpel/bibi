import { mcpTool, text } from "../../tools/meta";

export const conversationMcpTools = [
  mcpTool({ operation: "conversation.list" }),
  mcpTool({ operation: "conversation.get" }),
  mcpTool({
    operation: "conversation.create",
    summary: ({ input }) =>
      `Start conversation "${text({ value: input.title ?? "New conversation" })}"`,
  }),
  mcpTool({
    operation: "conversation.rename",
    idempotent: true,
    summary: ({ input }) =>
      `Rename conversation ${text({ value: input.id })} to "${text({ value: input.title })}"`,
  }),
  mcpTool({
    operation: "conversation.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive conversation ${text({ value: input.id })}`,
  }),
];
