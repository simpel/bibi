import { mcpTool, text } from "../../tools/meta";

type Named = { name?: unknown };

/** The names of a draft list, e.g. statuses or item types. */
const names = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value.map((row: Named) => text({ value: row?.name })).join(", ") : "";

/** The titles of the example orders. */
const titles = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((row: { title?: unknown }) => text({ value: row?.title })).join(", ")
    : "";

export const pipelineSetupMcpTools = [
  mcpTool({ operation: "pipelineSetup.preview" }),
  mcpTool({ operation: "pipelineSetup.presetDraft" }),
  mcpTool({
    operation: "pipelineSetup.activate",
    destructive: true,
    summary: ({ input }) =>
      `Set up the pipeline with statuses ${names({ value: input.statuses })} and item types ` +
      `${names({ value: input.itemTypes })}; other statuses and states of these types are archived`,
  }),
  mcpTool({
    operation: "pipelineSetup.createExamples",
    summary: ({ input }) =>
      `Create the example customer ${text({ value: (input.customer as Named)?.name })} with ` +
      `the example orders ${titles({ value: input.orders })}`,
  }),
];
