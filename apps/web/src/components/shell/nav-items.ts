import {
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ContactIcon,
  InboxIcon,
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
  | "bookings"
  | "inquiries"
  | "customers"
  | "items"
  | "venues"
  | "settings"
  | "platformAdmin";

/** Who sees an entry: everyone, members who can configure, or platform admins (ADR 0036). */
export type NavAudience = "everyone" | "configure" | "platformAdmin";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  audience: NavAudience;
};

export type NavGroupId = "primary" | "work" | "catalog" | "admin";

/**
 * Sidebar entries per zone, most used first (ADR 0036). A new entity adds its entry to the
 * right group (and its `nav.*` message); configuration pages go to `SETTINGS_ITEMS` instead.
 */
export const NAV_GROUPS: Record<NavGroupId, readonly NavItem[]> = {
  primary: [
    { href: ROUTES.pipeline, labelKey: "pipeline", icon: KanbanIcon, audience: "everyone" },
    {
      href: ROUTES.dashboard,
      labelKey: "dashboard",
      icon: LayoutDashboardIcon,
      audience: "everyone",
    },
  ],
  work: [
    { href: ROUTES.calendar, labelKey: "calendar", icon: CalendarRangeIcon, audience: "everyone" },
    { href: ROUTES.bookings, labelKey: "bookings", icon: CalendarIcon, audience: "everyone" },
    { href: ROUTES.inquiries, labelKey: "inquiries", icon: InboxIcon, audience: "everyone" },
  ],
  catalog: [
    { href: ROUTES.customers, labelKey: "customers", icon: ContactIcon, audience: "everyone" },
    { href: ROUTES.items, labelKey: "items", icon: BoxIcon, audience: "everyone" },
    { href: ROUTES.venues, labelKey: "venues", icon: BuildingIcon, audience: "everyone" },
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
