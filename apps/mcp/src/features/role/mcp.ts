import { mcpTool, text } from "../../tools/meta";

const describePermissions = ({ value }: { value: unknown }): string =>
  Object.entries((value ?? {}) as Record<string, readonly string[]>)
    .map(([resource, actions]) => `${resource}:${actions.at(-1) ?? "-"}`)
    .join(", ");

export const roleMcpTools = [
  mcpTool({ operation: "role.list" }),
  mcpTool({ operation: "role.get" }),
  mcpTool({
    operation: "role.create",
    summary: ({ input }) =>
      `Create role "${text({ value: input.name })}" (${describePermissions({ value: input.permissions })})`,
  }),
  mcpTool({
    operation: "role.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update role ${text({ value: input.id })}` +
      (input.name ? ` → "${text({ value: input.name })}"` : "") +
      (input.permissions ? ` (${describePermissions({ value: input.permissions })})` : ""),
  }),
  mcpTool({
    operation: "role.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive role ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "role.importTemplate",
    idempotent: true,
    summary: ({ input }) => `Import role template ${text({ value: input.template })}`,
  }),
];
