import { mcpTool } from "../../tools/meta";

export const notificationMcpTools = [
  mcpTool({ operation: "notification.list" }),
  mcpTool({ operation: "notification.unreadCount" }),
  mcpTool({ operation: "notification.markRead", idempotent: true }),
  mcpTool({ operation: "notification.markUnread", idempotent: true }),
  mcpTool({ operation: "notification.markAllRead", idempotent: true }),
  mcpTool({ operation: "notification.delete", idempotent: true }),
];
