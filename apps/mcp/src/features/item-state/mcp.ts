import { mcpTool, text } from "../../tools/meta";

const list = ({ value }: { value: unknown }): string =>
  Array.isArray(value) ? value.map((entry) => text({ value: entry })).join(", ") : "";

export const itemStateMcpTools = [
  mcpTool({ operation: "itemState.list" }),
  mcpTool({ operation: "itemState.get" }),
  mcpTool({
    operation: "itemState.create",
    summary: ({ input }) =>
      `Create item state "${text({ value: input.name })}" for type ` +
      text({ value: input.entityTypeId }),
  }),
  mcpTool({
    operation: "itemState.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update item state ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "itemState.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) =>
      `Archive item state ${text({ value: input.id })}` +
      (input.targetStateId === undefined
        ? ""
        : `, moving its lines to ${text({ value: input.targetStateId })}`),
  }),
  mcpTool({
    operation: "itemState.reorder",
    idempotent: true,
    summary: ({ input }) => `Reorder item states: ${list({ value: input.ids })}`,
  }),
  mcpTool({
    operation: "itemState.setTransitions",
    idempotent: true,
    summary: ({ input }) =>
      `Allow item state ${text({ value: input.id })} to move to: ` +
      (list({ value: input.toStateIds }) || "nothing"),
  }),
];
