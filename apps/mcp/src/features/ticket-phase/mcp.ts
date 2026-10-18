import { mcpTool, text } from "../../tools/meta";

const list = ({ value }: { value: unknown }): string =>
  Array.isArray(value) ? value.map((entry) => text({ value: entry })).join(", ") : "";

export const ticketPhaseMcpTools = [
  mcpTool({ operation: "ticketPhase.list" }),
  mcpTool({ operation: "ticketPhase.get" }),
  mcpTool({
    operation: "ticketPhase.create",
    summary: ({ input }) => `Create ticket phase "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "ticketPhase.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update ticket phase ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "ticketPhase.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) =>
      `Archive ticket phase ${text({ value: input.id })}` +
      (input.targetPhaseId === undefined
        ? ""
        : `, moving its tickets to ${text({ value: input.targetPhaseId })}`),
  }),
  mcpTool({
    operation: "ticketPhase.reorder",
    idempotent: true,
    summary: ({ input }) => `Reorder ticket phases: ${list({ value: input.ids })}`,
  }),
  mcpTool({
    operation: "ticketPhase.setTransitions",
    idempotent: true,
    summary: ({ input }) =>
      `Allow ticket phase ${text({ value: input.id })} to move to: ` +
      (list({ value: input.toPhaseIds }) || "nothing"),
  }),
  mcpTool({
    operation: "ticketPhase.importTemplate",
    idempotent: true,
    summary: ({ input }) => `Import ticket phase template ${text({ value: input.template })}`,
  }),
];
