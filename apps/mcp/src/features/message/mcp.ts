import { mcpTool, text } from "../../tools/meta";

export const messageMcpTools = [
  mcpTool({ operation: "message.list" }),
  mcpTool({
    operation: "message.append",
    summary: ({ input }) =>
      `Add a ${text({ value: input.role })} message to conversation ${text({ value: input.conversationId })}`,
  }),
];
