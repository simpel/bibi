import { mcpTool, text } from "../../tools/meta";

const changedKeys = ({ input }: { input: Record<string, unknown> }) =>
  Object.keys(input)
    .filter((key) => key !== "id")
    .join(", ");

export const taskMcpTools = [
  mcpTool({ operation: "task.list" }),
  mcpTool({ operation: "task.get" }),
  mcpTool({
    operation: "task.create",
    summary: ({ input }) =>
      `Create a task for customer ${text({ value: input.customerId })} at ${text({
        value: input.startsAt,
      })}${input.orderId ? `, linked to order ${text({ value: input.orderId })}` : ""}`,
  }),
  mcpTool({
    operation: "task.update",
    idempotent: true,
    summary: ({ input }) => `Edit task ${text({ value: input.id })}: ${changedKeys({ input })}`,
  }),
  mcpTool({
    operation: "task.complete",
    idempotent: true,
    summary: ({ input }) => `Mark task ${text({ value: input.id })} done`,
  }),
  mcpTool({
    operation: "task.reopen",
    idempotent: true,
    summary: ({ input }) => `Open task ${text({ value: input.id })} again`,
  }),
  mcpTool({
    operation: "task.linkOrder",
    summary: ({ input }) =>
      `Link task ${text({ value: input.taskId })} to order ${text({ value: input.orderId })}`,
  }),
  mcpTool({
    operation: "task.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Delete task ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "task.restore",
    destructive: false,
    idempotent: true,
    summary: ({ input }) => `Restore task ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "task.delete",
    destructive: true,
    summary: ({ input }) => `Delete task ${text({ value: input.id })} permanently`,
  }),
];
