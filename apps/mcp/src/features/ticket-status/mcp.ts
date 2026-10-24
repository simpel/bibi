import { mcpTool, text } from "../../tools/meta";

const list = ({ value }: { value: unknown }): string =>
  Array.isArray(value) ? value.map((entry) => text({ value: entry })).join(", ") : "";

export const ticketStatusMcpTools = [
  mcpTool({ operation: "ticketStatus.list" }),
  mcpTool({ operation: "ticketStatus.get" }),
  mcpTool({
    operation: "ticketStatus.create",
    summary: ({ input }) => `Create ticket status "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "ticketStatus.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update ticket status ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "ticketStatus.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) =>
      `Archive ticket status ${text({ value: input.id })}` +
      (input.targetStatusId === undefined
        ? ""
        : `, moving its tickets to ${text({ value: input.targetStatusId })}`),
  }),
  mcpTool({ operation: "ticketStatus.archivePreview" }),
  mcpTool({
    operation: "ticketStatus.reorder",
    idempotent: true,
    summary: ({ input }) => `Reorder ticket statuses: ${list({ value: input.ids })}`,
  }),
  mcpTool({
    operation: "ticketStatus.setTransitions",
    idempotent: true,
    summary: ({ input }) =>
      `Allow ticket status ${text({ value: input.id })} to move to: ` +
      (list({ value: input.toStatusIds }) || "nothing"),
  }),
  mcpTool({
    operation: "ticketStatus.importTemplate",
    idempotent: true,
    summary: ({ input }) => `Import ticket status template ${text({ value: input.template })}`,
  }),
];
