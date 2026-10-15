import { mcpTool, text } from "../../tools/meta";

const list = ({ value }: { value: unknown }): string =>
  Array.isArray(value) ? value.map((entry) => text({ value: entry })).join(", ") : "";

export const bookingStatusMcpTools = [
  mcpTool({ operation: "bookingStatus.list" }),
  mcpTool({ operation: "bookingStatus.get" }),
  mcpTool({
    operation: "bookingStatus.create",
    summary: ({ input }) =>
      `Create booking status "${text({ value: input.name })}" in phase ${text({ value: input.phase })}`,
  }),
  mcpTool({
    operation: "bookingStatus.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update booking status ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "bookingStatus.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive booking status ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "bookingStatus.reorder",
    idempotent: true,
    summary: ({ input }) => `Reorder booking statuses: ${list({ value: input.ids })}`,
  }),
  mcpTool({
    operation: "bookingStatus.setTransitions",
    idempotent: true,
    summary: ({ input }) =>
      `Allow booking status ${text({ value: input.id })} to move to: ` +
      (list({ value: input.toStatusIds }) || "nothing"),
  }),
  mcpTool({
    operation: "bookingStatus.importTemplate",
    idempotent: true,
    summary: ({ input }) => `Import booking status template ${text({ value: input.template })}`,
  }),
];
