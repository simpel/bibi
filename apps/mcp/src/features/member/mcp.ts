import { mcpTool, text } from "../../tools/meta";

export const memberMcpTools = [
  mcpTool({ operation: "member.list" }),
  mcpTool({
    operation: "member.assignRole",
    idempotent: true,
    summary: ({ input }) =>
      `Give member ${text({ value: input.id })} the roles ${((input.roles ?? []) as string[])
        .map((role) => `"${text({ value: role })}"`)
        .join(", ")}`,
  }),
];
