import { mcpTool, text } from "../../tools/meta";

type Named = { name?: unknown };

/** The names of a draft list, e.g. phases or item types. */
const names = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value.map((row: Named) => text({ value: row?.name })).join(", ") : "";

export const pipelineSetupMcpTools = [
  mcpTool({ operation: "pipelineSetup.preview" }),
  mcpTool({ operation: "pipelineSetup.presetDraft" }),
  mcpTool({
    operation: "pipelineSetup.activate",
    destructive: true,
    summary: ({ input }) =>
      `Set up the pipeline with phases ${names({ value: input.phases })} and item types ` +
      `${names({ value: input.itemTypes })}; other phases and states of these types are archived`,
  }),
];
