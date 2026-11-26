import type { Permission } from "@bibi/core";
import { type LucideIcon, PlusIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { NAV_GROUPS, type NavItem } from "./nav-items";

export type CommandEntry = {
  href: string;
  labelKey:
    | "createOrder"
    | "createTask"
    | "createCustomer"
    | "createRunSheet"
    | "createVenue"
    | "createItem";
  icon: LucideIcon;
  /** "Create X" needs its feature's `write` (ADR 0050). */
  permission: Permission;
};

/** The sidebar's pages, most used first; the administration area is the Settings group's. */
export const NAVIGATE_ENTRIES: readonly NavItem[] = [
  ...NAV_GROUPS.primary,
  ...NAV_GROUPS.work.filter((item) => !item.requires),
  ...NAV_GROUPS.catalog,
];

export const ACTION_ENTRIES: readonly CommandEntry[] = [
  { href: ROUTES.orderNew, labelKey: "createOrder", icon: PlusIcon, permission: "order:write" },
  { href: ROUTES.taskNew, labelKey: "createTask", icon: PlusIcon, permission: "task:write" },
  {
    href: ROUTES.customerNew,
    labelKey: "createCustomer",
    icon: PlusIcon,
    permission: "customer:write",
  },
  {
    href: ROUTES.runSheetNew,
    labelKey: "createRunSheet",
    icon: PlusIcon,
    permission: "runSheet:write",
  },
  { href: ROUTES.venueNew, labelKey: "createVenue", icon: PlusIcon, permission: "venue:write" },
  { href: ROUTES.itemNew, labelKey: "createItem", icon: PlusIcon, permission: "item:write" },
];
