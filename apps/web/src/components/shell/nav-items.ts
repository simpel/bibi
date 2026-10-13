import { BuildingIcon, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type NavItem = { href: string; labelKey: "venues"; icon: LucideIcon };

/** Sidebar entries; add the next entity here (and its `nav.*` message). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: ROUTES.venues, labelKey: "venues", icon: BuildingIcon },
];
