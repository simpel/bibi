import type { NotificationDto, PermissionSet } from "@bibi/core";

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

/** The bell's server-rendered state (ADR 0094); the stream keeps the count live. */
export type NotificationBellData = { unread: number; latest: NotificationDto[] };
