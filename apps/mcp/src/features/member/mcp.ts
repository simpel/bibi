import { mcpTool, text } from "../../tools/meta";

const roleList = ({ value }: { value: unknown }): string =>
  ((value ?? []) as string[]).map((role) => `"${text({ value: role })}"`).join(", ");

export const memberMcpTools = [
  mcpTool({ operation: "member.list" }),
  mcpTool({
    operation: "member.assignRole",
    idempotent: true,
    summary: ({ input }) =>
      `Give member ${text({ value: input.id })} the roles ${roleList({ value: input.roles })}`,
  }),
  mcpTool({
    operation: "member.remove",
    destructive: true,
    summary: ({ input }) => `Remove member ${text({ value: input.id })} from the organization`,
  }),
  mcpTool({ operation: "member.listInvitations" }),
  mcpTool({
    operation: "member.invite",
    summary: ({ input }) =>
      `Invite ${text({ value: input.email })} with the roles ${roleList({ value: input.roles })}`,
  }),
  mcpTool({
    operation: "member.cancelInvitation",
    destructive: true,
    summary: ({ input }) => `Revoke invitation ${text({ value: input.id })}`,
  }),
];
