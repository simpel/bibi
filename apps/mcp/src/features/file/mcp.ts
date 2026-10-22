import { mcpTool, text } from "../../tools/meta";

export const fileMcpTools = [
  mcpTool({
    operation: "file.upload",
    summary: ({ input }) => `Upload a ${text({ value: input.contentType })} image`,
  }),
  mcpTool({ operation: "file.get" }),
];
