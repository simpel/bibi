import { mcpTool } from "../../tools/meta";

/** Credit notes are read here; `invoice_credit` creates them. */
export const creditNoteMcpTools = [
  mcpTool({ operation: "creditNote.list" }),
  mcpTool({ operation: "creditNote.get" }),
];
