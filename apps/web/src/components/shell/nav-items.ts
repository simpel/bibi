import type { Permission } from "@okazi/core";
import {
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ContactIcon,
  KanbanIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type NavLabelKey =
  | "dashboard"
  | "pipeline"
  | "calendar"
  | "tickets"
  | "customers"
  | "items"
  | "venues"
  | "members"
  | "apiKeys"
  | "settings";

/** Who sees an entry: everyone (subject to its permission) or settings viewers. */
export type NavAudience = "everyone" | "configure";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  audience: NavAudience;
  /** The view permission an entry needs (ADR 0050); absent = no permission needed. */
  permission?: Permission;
};

export type NavGroupId = "primary" | "work" | "catalog" | "admin";

/**
 * Sidebar entries per zone, most used first (ADR 0036). A new entity adds its entry to the
 * right group (and its `nav.*` message); configuration pages go to `SETTINGS_ITEMS` instead.
 */
export const NAV_GROUPS: Record<NavGroupId, readonly NavItem[]> = {
  primary: [
    {
      href: ROUTES.pipeline,
      labelKey: "pipeline",
      icon: KanbanIcon,
      audience: "everyone",
      permission: "ticket:read",
    },
    {
      href: ROUTES.dashboard,
      labelKey: "dashboard",
      icon: LayoutDashboardIcon,
      audience: "everyone",
      permission: "ticket:read",
    },
  ],
  work: [
    {
      href: ROUTES.calendar,
      labelKey: "calendar",
      icon: CalendarRangeIcon,
      audience: "everyone",
      permission: "ticket:read",
    },
    {
      href: ROUTES.tickets,
      labelKey: "tickets",
      icon: CalendarIcon,
      audience: "everyone",
      permission: "ticket:read",
    },
  ],
  catalog: [
    {
      href: ROUTES.customers,
      labelKey: "customers",
      icon: ContactIcon,
      audience: "everyone",
      permission: "customer:read",
    },
    {
      href: ROUTES.items,
      labelKey: "items",
      icon: BoxIcon,
      audience: "everyone",
      permission: "item:read",
    },
    {
      href: ROUTES.venues,
      labelKey: "venues",
      icon: BuildingIcon,
      audience: "everyone",
      permission: "venue:read",
    },
  ],
  admin: [
    // Members (each row links to their permissions) and API keys, so admins find them directly.
    {
      href: ROUTES.settingsMembers,
      labelKey: "members",
      icon: UsersIcon,
      audience: "everyone",
      permission: "member:write",
    },
    {
      href: ROUTES.settingsIntegrations,
      labelKey: "apiKeys",
      icon: KeyRoundIcon,
      audience: "everyone",
      permission: "apiKey:read",
    },
    { href: ROUTES.settings, labelKey: "settings", icon: SettingsIcon, audience: "configure" },
  ],
};
