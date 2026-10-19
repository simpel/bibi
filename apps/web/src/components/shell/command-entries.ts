import type { Permission } from "@okazi/core";
import { BoxIcon, BuildingIcon, type LucideIcon, PlusIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type CommandEntry = {
  href: string;
  labelKey: "goToVenues" | "goToItems" | "createVenue" | "createItem";
  icon: LucideIcon;
  /** Navigation needs the target feature's `view`, "create X" needs its `create` (ADR 0050). */
  permission: Permission;
};

export const NAVIGATE_ENTRIES: readonly CommandEntry[] = [
  { href: ROUTES.venues, labelKey: "goToVenues", icon: BuildingIcon, permission: "venue:view" },
  { href: ROUTES.items, labelKey: "goToItems", icon: BoxIcon, permission: "item:view" },
];

export const ACTION_ENTRIES: readonly CommandEntry[] = [
  { href: ROUTES.venueNew, labelKey: "createVenue", icon: PlusIcon, permission: "venue:create" },
  { href: ROUTES.itemNew, labelKey: "createItem", icon: PlusIcon, permission: "item:create" },
];
