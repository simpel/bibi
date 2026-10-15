import {
  BookOpenIcon,
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  CircleDotIcon,
  ClipboardListIcon,
  ContactIcon,
  CreditCardIcon,
  LayoutGridIcon,
  ListIcon,
  type LucideIcon,
  Repeat2Icon,
  ShapesIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type NavItem = {
  href: string;
  labelKey:
    | "venues"
    | "items"
    | "customers"
    | "bookings"
    | "bookingSeries"
    | "skills"
    | "types"
    | "lists"
    | "setups"
    | "sheets"
    | "bookingStatuses"
    | "roles"
    | "members"
    | "payments";
  icon: LucideIcon;
};

/** Sidebar entries; add the next entity here (and its `nav.*` message). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: ROUTES.venues, labelKey: "venues", icon: BuildingIcon },
  { href: ROUTES.items, labelKey: "items", icon: BoxIcon },
  { href: ROUTES.customers, labelKey: "customers", icon: ContactIcon },
  { href: ROUTES.bookings, labelKey: "bookings", icon: CalendarIcon },
  { href: ROUTES.bookingSeries, labelKey: "bookingSeries", icon: Repeat2Icon },
  { href: ROUTES.skills, labelKey: "skills", icon: BookOpenIcon },
  { href: ROUTES.settingsTypes, labelKey: "types", icon: ShapesIcon },
  { href: ROUTES.settingsLists, labelKey: "lists", icon: ListIcon },
  { href: ROUTES.settingsSetups, labelKey: "setups", icon: LayoutGridIcon },
  { href: ROUTES.settingsSheets, labelKey: "sheets", icon: ClipboardListIcon },
  { href: ROUTES.settingsBookingStatuses, labelKey: "bookingStatuses", icon: CircleDotIcon },
  { href: ROUTES.settingsRoles, labelKey: "roles", icon: ShieldIcon },
  { href: ROUTES.settingsMembers, labelKey: "members", icon: UsersIcon },
  { href: ROUTES.settingsPayments, labelKey: "payments", icon: CreditCardIcon },
];
