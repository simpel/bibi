import {
  BookOpenIcon,
  CircleDotIcon,
  ClipboardListIcon,
  CreditCardIcon,
  LayoutGridIcon,
  ListIcon,
  type LucideIcon,
  ShapesIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type SettingsKey =
  | "types"
  | "lists"
  | "setups"
  | "sheets"
  | "priceLists"
  | "bookingStatuses"
  | "roles"
  | "members"
  | "payments"
  | "skills";

export type SettingsItem = { href: string; key: SettingsKey; icon: LucideIcon };

/** The configuration pages listed on the `/settings` hub (ADR 0036). */
export const SETTINGS_ITEMS: readonly SettingsItem[] = [
  { href: ROUTES.settingsTypes, key: "types", icon: ShapesIcon },
  { href: ROUTES.settingsLists, key: "lists", icon: ListIcon },
  { href: ROUTES.settingsSetups, key: "setups", icon: LayoutGridIcon },
  { href: ROUTES.settingsSheets, key: "sheets", icon: ClipboardListIcon },
  { href: ROUTES.settingsPriceLists, key: "priceLists", icon: TagIcon },
  { href: ROUTES.settingsBookingStatuses, key: "bookingStatuses", icon: CircleDotIcon },
  { href: ROUTES.settingsMembers, key: "members", icon: UsersIcon },
  { href: ROUTES.settingsRoles, key: "roles", icon: ShieldIcon },
  { href: ROUTES.settingsPayments, key: "payments", icon: CreditCardIcon },
  { href: ROUTES.skills, key: "skills", icon: BookOpenIcon },
];
