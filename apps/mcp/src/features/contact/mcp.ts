import { mcpTool, text } from "../../tools/meta";

export const contactMcpTools = [
  mcpTool({ operation: "contact.list" }),
  mcpTool({ operation: "contact.get" }),
  mcpTool({
    operation: "contact.create",
    summary: ({ input }) =>
      `Create contact "${text({ value: input.name })}" at customer ${text({ value: input.customerId })}`,
  }),
  mcpTool({
    operation: "contact.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update contact ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "contact.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive contact ${text({ value: input.id })}`,
  }),
];
