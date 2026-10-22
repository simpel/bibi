import { SUPERADMIN_ROLE } from "@bibi/core";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

/**
 * Every HTTP endpoint the admin plugin adds. All are disabled: the plugin is used only for the
 * `user.role` field and ban enforcement. Roles are granted with the `grant-superadmin` CLI, so no
 * browser request can ever impersonate, ban or promote anyone.
 */
export const DISABLED_ADMIN_PATHS = [
  "/admin/ban-user",
  "/admin/create-user",
  "/admin/get-user",
  "/admin/has-permission",
  "/admin/impersonate-user",
  "/admin/list-user-sessions",
  "/admin/list-users",
  "/admin/remove-user",
  "/admin/revoke-user-session",
  "/admin/revoke-user-sessions",
  "/admin/set-role",
  "/admin/set-user-password",
  "/admin/stop-impersonating",
  "/admin/unban-user",
  "/admin/update-user",
];

/** Platform-level user role (`user`/`superadmin`), separate from organization roles (ADR 0004). */
export const adminPlugin = () =>
  admin({
    roles: { user: userAc, [SUPERADMIN_ROLE]: adminAc },
    defaultRole: "user",
    adminRoles: [SUPERADMIN_ROLE],
  });
