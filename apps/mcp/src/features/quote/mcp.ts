import { mcpTool, text } from "../../tools/meta";

export const quoteMcpTools = [
  mcpTool({ operation: "quote.list" }),
  mcpTool({ operation: "quote.get" }),
  mcpTool({
    operation: "quote.create",
    summary: ({ input }) =>
      `Create a quote of the lines of ticket ${text({ value: input.ticketId })}`,
  }),
  mcpTool({
    operation: "quote.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update draft quote ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "quote.revise",
    summary: ({ input }) => `Make a new version of quote ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "quote.send",
    summary: ({ input }) =>
      `Send quote ${text({ value: input.id })}, freezing the ticket's priced lines`,
  }),
  mcpTool({
    operation: "quote.accept",
    summary: ({ input }) => `Record that quote ${text({ value: input.id })} was accepted`,
  }),
  mcpTool({
    operation: "quote.decline",
    summary: ({ input }) => `Record that quote ${text({ value: input.id })} was declined`,
  }),
  mcpTool({
    operation: "quote.expire",
    summary: ({ input }) => `Expire quote ${text({ value: input.id })}`,
  }),
];
