import { mcpTool, text } from "../../tools/meta";

export const ticketTemplateMcpTools = [
  mcpTool({ operation: "ticketTemplate.list" }),
  mcpTool({ operation: "ticketTemplate.get" }),
  mcpTool({
    operation: "ticketTemplate.create",
    summary: ({ input }) => `Create predefined ticket "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "ticketTemplate.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update predefined ticket ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "ticketTemplate.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive predefined ticket ${text({ value: input.id })}`,
  }),
];
