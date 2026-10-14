import { mcpTool, text } from "../../tools/meta";

const list = ({ value }: { value: unknown }): string =>
  Array.isArray(value) ? value.join(", ") : "none";

export const entityTypeMcpTools = [
  mcpTool({ operation: "entityType.list" }),
  mcpTool({ operation: "entityType.get" }),
  mcpTool({
    operation: "entityType.create",
    summary: ({ input }) =>
      `Create ${text({ value: input.base })} type "${text({ value: input.name })}" (behaviours: ${list({ value: input.behaviours })})`,
  }),
  mcpTool({
    operation: "entityType.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update type ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "entityType.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive type ${text({ value: input.id })}`,
  }),
];
