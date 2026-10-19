import type { Permission } from "@okazi/core";
import {
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ContactIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  SettingsIcon,
  ShieldCheckIcon,
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
  | "settings"
  | "platformAdmin";

/** Who sees an entry: everyone (subject to its permission), settings viewers, or superadmins. */
export type NavAudience = "everyone" | "configure" | "platformAdmin";

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
      permission: "ticket:view",
    },
    {
      href: ROUTES.dashboard,
      labelKey: "dashboard",
      icon: LayoutDashboardIcon,
      audience: "everyone",
      permission: "ticket:view",
    },
  ],
  work: [
    {
      href: ROUTES.calendar,
      labelKey: "calendar",
      icon: CalendarRangeIcon,
      audience: "everyone",
      permission: "ticket:view",
    },
    {
      href: ROUTES.tickets,
      labelKey: "tickets",
      icon: CalendarIcon,
      audience: "everyone",
      permission: "ticket:view",
    },
  ],
  catalog: [
    {
      href: ROUTES.customers,
      labelKey: "customers",
      icon: ContactIcon,
      audience: "everyone",
      permission: "customer:view",
    },
    {
      href: ROUTES.items,
      labelKey: "items",
      icon: BoxIcon,
      audience: "everyone",
      permission: "item:view",
    },
    {
      href: ROUTES.venues,
      labelKey: "venues",
      icon: BuildingIcon,
      audience: "everyone",
      permission: "venue:view",
    },
  ],
  admin: [
    { href: ROUTES.settings, labelKey: "settings", icon: SettingsIcon, audience: "configure" },
    {
      href: ROUTES.admin,
      labelKey: "platformAdmin",
      icon: ShieldCheckIcon,
      audience: "platformAdmin",
    },
  ],
};
