import type { Permission } from "@bibi/core";
import {
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  CalendarRangeIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  ContactIcon,
  CopyPlusIcon,
  HouseIcon,
  InboxIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { ROUTES } from "@/lib/routes";

export type NavLabelKey =
  | "myWork"
  | "assistant"
  | "dashboard"
  | "pipeline"
  | "calendar"
  | "financials"
  | "forecast"
  | "workload"
  | "orders"
  | "tasks"
  | "runSheets"
  | "reservations"
  | "inbox"
  | "customers"
  | "items"
  | "venues"
  | "orderTemplates"
  | "members"
  | "apiKeys"
  | "admin";

/** Who sees an entry: everyone (subject to its permission) or members who may open the administration area. */
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
  /** Shown only when the organization has what the entry needs: a dining room (ADR 0119). */
  requires?: "diningRoom";
  /** A live count shown as a badge (ADR 0094). */
  badge?: NavBadgeKind;
};

export type NavBadgeKind = "inbox" | "myWork";

export type NavGroupId = "primary" | "work" | "catalog" | "admin";

/**
 * Sidebar entries per zone, most used first (ADR 0036). A new entity adds its entry to the
 * right group (and its `nav.*` message); administration pages go to `ADMIN_GROUPS` instead.
 */
export const NAV_GROUPS: Record<NavGroupId, readonly NavItem[]> = {
  primary: [
    // The start page: what concerns the signed-in member (ADR 0110).
    {
      href: ROUTES.home,
      labelKey: "myWork",
      icon: HouseIcon,
      audience: "everyone",
      badge: "myWork",
    },
    // The assistant, full width (ADR 0110); ⌘K also starts a chat.
    {
      href: ROUTES.assistant,
      labelKey: "assistant",
      icon: MessageSquareIcon,
      audience: "everyone",
      permission: "assistant:read",
    },
    {
      href: ROUTES.pipeline,
      labelKey: "pipeline",
      icon: KanbanIcon,
      audience: "everyone",
      permission: "order:read",
    },
    {
      href: ROUTES.dashboard,
      labelKey: "dashboard",
      icon: LayoutDashboardIcon,
      audience: "everyone",
      permission: "order:read",
    },
  ],
  work: [
    {
      href: ROUTES.calendar,
      labelKey: "calendar",
      icon: CalendarRangeIcon,
      audience: "everyone",
      permission: "order:read",
    },
    {
      href: ROUTES.orders,
      labelKey: "orders",
      icon: CalendarIcon,
      audience: "everyone",
      permission: "order:read",
    },
    // Site visits, tastings and deadlines around a customer (ADR 0117).
    {
      href: ROUTES.tasks,
      labelKey: "tasks",
      icon: CircleCheckIcon,
      audience: "everyone",
      permission: "task:read",
    },
    // Table bookings of the day (ADR 0119); only for organizations with a dining room.
    {
      href: ROUTES.reservations,
      labelKey: "reservations",
      icon: UtensilsCrossedIcon,
      audience: "everyone",
      permission: "reservation:read",
      requires: "diningRoom",
    },
    {
      href: ROUTES.runSheets,
      labelKey: "runSheets",
      icon: ClipboardListIcon,
      audience: "everyone",
      permission: "runSheet:read",
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
    // Packages are daily sales work, not administration (ADR 0112).
    {
      href: ROUTES.packages,
      labelKey: "orderTemplates",
      icon: CopyPlusIcon,
      audience: "everyone",
      permission: "orderTemplate:read",
    },
  ],
  admin: [
    {
      href: ROUTES.admin,
      labelKey: "admin",
      icon: ShieldCheckIcon,
      audience: "configure",
    },
  ],
};
