import { mcpTool } from "./tools/meta";

/** `search` is not a core entity, so it lives outside `features/` (see tools/check-structure). */
export const searchMcpTools = [mcpTool({ operation: "search" })];
