import type { PermissionSet } from "@bibi/core";

/**
 * What the signed-in member may see in the shell; navigation only, pages check again.
 * `canConfigure` = may see at least one settings page; `permissions` = the effective set (ADR 0050).
 * `canDraftFromMessage` = drafting a ticket from a message has a model (ADR 0084).
 */
export type ShellAccess = {
  canConfigure: boolean;
  canDraftFromMessage: boolean;
  platformAdmin: boolean;
  permissions: PermissionSet;
};

export type ShellUser = { name: string; email: string };

/**
 * The shell's server-rendered counts (ADR 0094), kept live by the stream: the bell's unread
 * notifications and the inbox badge (null without `inbox:read`).
 */
export type ShellCounts = { unread: number; inboxOpen: number | null };
