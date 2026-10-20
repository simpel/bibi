import { mcpTool, text } from "../../tools/meta";

type Step = { operation?: unknown };

/** The steps by operation, e.g. `item.create, item.create, item.saveAsPackage`. */
const stepNames = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((step: Step) => text({ value: step?.operation })).join(", ")
    : "";

export const changeSetMcpTools = [
  mcpTool({
    operation: "changeSet.apply",
    summary: ({ input }) => {
      const count = Array.isArray(input.steps) ? input.steps.length : 0;
      return `${text({ value: input.title })} (${count} changes: ${stepNames({ value: input.steps })})`;
    },
  }),
];
