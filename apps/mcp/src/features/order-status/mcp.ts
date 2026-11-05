import { mcpTool, text } from "../../tools/meta";

const list = ({ value }: { value: unknown }): string =>
  Array.isArray(value) ? value.map((entry) => text({ value: entry })).join(", ") : "";

export const orderStatusMcpTools = [
  mcpTool({ operation: "orderStatus.list" }),
  mcpTool({ operation: "orderStatus.get" }),
  mcpTool({
    operation: "orderStatus.create",
    summary: ({ input }) => `Create order status "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "orderStatus.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update order status ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "orderStatus.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) =>
      `Archive order status ${text({ value: input.id })}` +
      (input.targetStatusId === undefined
        ? ""
        : `, moving its orders to ${text({ value: input.targetStatusId })}`),
  }),
  mcpTool({ operation: "orderStatus.archivePreview" }),
  mcpTool({
    operation: "orderStatus.reorder",
    idempotent: true,
    summary: ({ input }) => `Reorder order statuses: ${list({ value: input.ids })}`,
  }),
  mcpTool({
    operation: "orderStatus.setTransitions",
    idempotent: true,
    summary: ({ input }) =>
      input.allowedNext === "ANY"
        ? `Let orders in order status ${text({ value: input.id })} move to any status`
        : `Allow order status ${text({ value: input.id })} to move only to: ` +
          (list({ value: input.toStatusIds }) || "nothing"),
  }),
  mcpTool({
    operation: "orderStatus.setGates",
    idempotent: true,
    summary: ({ input }) =>
      `Set the gates on moves into order status ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "orderStatus.importTemplate",
    idempotent: true,
    summary: ({ input }) => `Import order status template ${text({ value: input.template })}`,
  }),
];
