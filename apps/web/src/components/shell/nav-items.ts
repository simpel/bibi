import {
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  ContactIcon,
  InboxIcon,
  type LucideIcon,
  Repeat2Icon,
  SettingsIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type NavLabelKey =
  | "bookings"
  | "inquiries"
  | "bookingSeries"
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

export type NavGroupId = "work" | "catalog" | "admin";

/**
 * Sidebar entries per zone, most used first (ADR 0036). A new entity adds its entry to the
 * right group (and its `nav.*` message); configuration pages go to `SETTINGS_ITEMS` instead.
 */
export const NAV_GROUPS: Record<NavGroupId, readonly NavItem[]> = {
  work: [
    { href: ROUTES.bookings, labelKey: "bookings", icon: CalendarIcon, audience: "everyone" },
    { href: ROUTES.inquiries, labelKey: "inquiries", icon: InboxIcon, audience: "everyone" },
    {
      href: ROUTES.bookingSeries,
      labelKey: "bookingSeries",
      icon: Repeat2Icon,
      audience: "everyone",
    },
    { href: ROUTES.customers, labelKey: "customers", icon: ContactIcon, audience: "everyone" },
  ],
  catalog: [
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
