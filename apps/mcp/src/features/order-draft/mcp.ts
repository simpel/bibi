import { mcpTool } from "../../tools/meta";

/** A read: the assistant drafts from a message, then proposes `order.create` (ADR 0084). */
export const orderDraftMcpTools = [mcpTool({ operation: "orderDraft.fromMessage" })];
