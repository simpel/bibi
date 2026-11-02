import { mcpTool } from "../../tools/meta";

/** A read: the assistant drafts from a message, then proposes `ticket.create` (ADR 0084). */
export const ticketDraftMcpTools = [mcpTool({ operation: "ticketDraft.fromMessage" })];
