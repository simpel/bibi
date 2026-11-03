import type { Permission } from "@bibi/core";
import {
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ClipboardListIcon,
  ContactIcon,
  InboxIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { ROUTES } from "@/lib/routes";

export type NavLabelKey =
  | "dashboard"
  | "pipeline"
  | "calendar"
  | "financials"
  | "tickets"
  | "workOrders"
  | "workOrdersToday"
  | "workOrdersAll"
  | "inbox"
  | "customers"
  | "items"
  | "venues"
  | "members"
  | "apiKeys"
  | "settings"
  | "admin";

/** Who sees an entry: everyone (subject to its permission) or settings viewers. */
export type NavAudience = "everyone" | "configure";

/** A page under an entry, shown as a sub-item while the entry is expanded. */
export type NavChild = { href: string; labelKey: NavLabelKey };

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  audience: NavAudience;
  /** The view permission an entry needs (ADR 0050); absent = no permission needed. */
  permission?: Permission;
  /** Sub-pages; the entry's own `href` is the first of them (the section's default). */
  children?: readonly NavChild[];
  /** A live count shown as a badge (ADR 0094). */
  badge?: NavBadgeKind;
};

export type NavBadgeKind = "inbox";

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
    {
      href: ROUTES.workOrders,
      labelKey: "workOrders",
      icon: ClipboardListIcon,
      audience: "everyone",
      permission: "workOrder:read",
      children: [
        { href: ROUTES.workOrders, labelKey: "workOrdersToday" },
        { href: ROUTES.workOrdersAll, labelKey: "workOrdersAll" },
      ],
    },
    {
      href: INBOX_ROUTE,
      labelKey: "inbox",
      icon: InboxIcon,
      audience: "everyone",
      permission: "inbox:read",
      badge: "inbox",
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
    {
      href: ROUTES.admin,
      labelKey: "admin",
      icon: ShieldCheckIcon,
      audience: "everyone",
      permission: "member:write",
    },
  ],
};
