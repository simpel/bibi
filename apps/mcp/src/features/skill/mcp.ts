import { mcpTool, text } from "../../tools/meta";

const skillId = ({ input }: { input: Record<string, unknown> }) => text({ value: input.id });

export const skillMcpTools = [
  mcpTool({ operation: "skill.list" }),
  mcpTool({ operation: "skill.get" }),
  mcpTool({ operation: "skill.export" }),
  mcpTool({
    operation: "skill.create",
    summary: ({ input }) =>
      `Create ${text({ value: input.scope ?? "PERSONAL" }).toLowerCase()} skill "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "skill.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update skill ${skillId({ input })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "skill.publish",
    idempotent: true,
    summary: ({ input }) => `Publish skill ${skillId({ input })}`,
  }),
  mcpTool({
    operation: "skill.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive skill ${skillId({ input })}`,
  }),
  mcpTool({
    operation: "skill.share",
    summary: ({ input }) => `Share personal skill ${skillId({ input })} with the organization`,
  }),
  mcpTool({
    operation: "skill.import",
    summary: ({ input }) => {
      const name = /^name:\s*(.+)$/m.exec(text({ value: input.markdown }))?.[1] ?? "SKILL.md";
      return `Import skill "${name.trim()}" as ${text({ value: input.scope ?? "PERSONAL" }).toLowerCase()} draft`;
    },
  }),
];
