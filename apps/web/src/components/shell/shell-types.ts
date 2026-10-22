import type { PermissionSet } from "@bibi/core";

/**
 * What the signed-in member may see in the shell; navigation only, pages check again.
 * `canConfigure` = may see at least one settings page; `permissions` = the effective set (ADR 0050).
 */
export type ShellAccess = {
  canConfigure: boolean;
  platformAdmin: boolean;
  permissions: PermissionSet;
};

export type ShellUser = { name: string; email: string };
