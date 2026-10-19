import { mcpTool, text } from "../../tools/meta";

export const permissionMcpTools = [
  mcpTool({ operation: "permission.get" }),
  mcpTool({
    operation: "permission.update",
    idempotent: true,
    summary: ({ input }) =>
      `Change the permission overrides of ${text({ value: input.subjectType })} ${text({ value: input.subjectId })}`,
  }),
];
