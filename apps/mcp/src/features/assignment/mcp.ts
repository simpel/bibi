import { mcpTool, text } from "../../tools/meta";

type SlotInput = { input: Record<string, unknown> };

/** "ticket b1" or "ticket b1 (responsibility r1)". */
const slot = ({ input }: SlotInput): string =>
  `${String(input.subjectType).toLowerCase()} ${text({ value: input.subjectId })}${
    input.responsibilityId ? ` (responsibility ${text({ value: input.responsibilityId })})` : ""
  }`;

export const assignmentMcpTools = [
  mcpTool({ operation: "assignment.list" }),
  mcpTool({ operation: "assignment.listMine" }),
  mcpTool({
    operation: "assignment.assign",
    idempotent: true,
    summary: ({ input }) =>
      `Assign ${slot({ input })} to ${
        input.assigneeId === null ? "nobody" : text({ value: input.assigneeId })
      }`,
  }),
  mcpTool({
    operation: "assignment.follow",
    idempotent: true,
    summary: ({ input }) => `Let ${text({ value: input.userId })} follow ${slot({ input })}`,
  }),
  mcpTool({
    operation: "assignment.unfollow",
    idempotent: true,
    summary: ({ input }) => `Stop ${text({ value: input.userId })} following ${slot({ input })}`,
  }),
];
