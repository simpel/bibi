import { mcpTool, text } from "../../tools/meta";

const lineCount = ({ lines }: { lines?: unknown[] }) =>
  lines === undefined ? "" : ` with ${lines.length} line(s)`;

export const quoteMcpTools = [
  mcpTool({ operation: "quote.list" }),
  mcpTool({ operation: "quote.get" }),
  mcpTool({
    operation: "quote.create",
    summary: ({ input }) =>
      `Create a quote for ticket ${text({ value: input.ticketId })}${lineCount(input)}`,
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
    summary: ({ input }) => `Mark quote ${text({ value: input.id })} as sent`,
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
