import { admin } from "better-auth/plugins";

/** `user.role` value that makes someone a platform (product) admin (ADR 0015). */
export const PLATFORM_ADMIN_ROLE = "admin";

/**
 * Every HTTP endpoint the admin plugin adds. All are disabled: the plugin is used only for the
 * `user.role` field and ban enforcement. Roles are granted with the `grant-admin` CLI, so no
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

/** Platform-level user role (`user`/`admin`), separate from organization roles (ADR 0004). */
export const adminPlugin = () => admin({ defaultRole: "user", adminRoles: [PLATFORM_ADMIN_ROLE] });
