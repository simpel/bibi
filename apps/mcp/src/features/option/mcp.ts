import { mcpTool, text } from "../../tools/meta";

export const optionMcpTools = [
  mcpTool({ operation: "option.list" }),
  mcpTool({ operation: "option.get" }),
  mcpTool({
    operation: "option.create",
    summary: ({ input }) =>
      `Place an option on item ${text({ value: input.itemId })} from ` +
      `${text({ value: input.startsAt })} to ${text({ value: input.endsAt })}, expiring ` +
      `${text({ value: input.expiresAt })}`,
  }),
  mcpTool({
    operation: "option.release",
    destructive: true,
    summary: ({ input }) => `Release option ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "option.expireDue",
    destructive: true,
    idempotent: true,
    summary: () => "Expire every active option whose expiry date has passed",
  }),
];
