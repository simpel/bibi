import {
  BookOpenIcon,
  BoxIcon,
  BuildingIcon,
  LayoutGridIcon,
  ListIcon,
  type LucideIcon,
  ShapesIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type NavItem = {
  href: string;
  labelKey: "venues" | "items" | "skills" | "types" | "lists" | "setups" | "roles" | "members";
  icon: LucideIcon;
};

/** Sidebar entries; add the next entity here (and its `nav.*` message). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: ROUTES.venues, labelKey: "venues", icon: BuildingIcon },
  { href: ROUTES.items, labelKey: "items", icon: BoxIcon },
  { href: ROUTES.skills, labelKey: "skills", icon: BookOpenIcon },
  { href: ROUTES.settingsTypes, labelKey: "types", icon: ShapesIcon },
  { href: ROUTES.settingsLists, labelKey: "lists", icon: ListIcon },
  { href: ROUTES.settingsSetups, labelKey: "setups", icon: LayoutGridIcon },
  { href: ROUTES.settingsRoles, labelKey: "roles", icon: ShieldIcon },
  { href: ROUTES.settingsMembers, labelKey: "members", icon: UsersIcon },
];
