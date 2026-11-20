import { mcpTool, text } from "../../tools/meta";

export const commentMcpTools = [
  mcpTool({ operation: "comment.list" }),
  mcpTool({ operation: "comment.get" }),
  mcpTool({
    operation: "comment.create",
    summary: ({ input }) =>
      `Comment on ${
        input.lineId
          ? `line ${text({ value: input.lineId })}`
          : `order ${text({ value: input.orderId })}`
      }: "${text({ value: input.body })}"`,
  }),
  mcpTool({
    operation: "comment.update",
    idempotent: true,
    summary: ({ input }) =>
      `Edit comment ${text({ value: input.id })}: "${text({ value: input.body })}"`,
  }),
  mcpTool({
    operation: "comment.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Delete comment ${text({ value: input.id })}`,
  }),
];
