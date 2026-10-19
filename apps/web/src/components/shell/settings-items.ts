import type { Permission, PermissionSet } from "@okazi/core";
import {
  BookOpenIcon,
  CircleDotIcon,
  ClipboardListIcon,
  CopyPlusIcon,
  CreditCardIcon,
  LayoutGridIcon,
  ListChecksIcon,
  ListIcon,
  type LucideIcon,
  PlugIcon,
  ShapesIcon,
  TagIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { canPermission } from "@/lib/can";
import { ROUTES } from "@/lib/routes";

export type SettingsKey =
  | "types"
  | "lists"
  | "setups"
  | "responsibilities"
  | "sheets"
  | "priceLists"
  | "ticketPhases"
  | "itemStates"
  | "ticketTemplates"
  | "members"
  | "payments"
  | "integrations"
  | "skills";

export type SettingsItem = {
  href: string;
  key: SettingsKey;
  icon: LucideIcon;
  /** The view permission the page needs (ADR 0050); `null` = the caller's own space, always open. */
  permission: Permission | null;
};

/** The configuration pages listed on the `/settings` hub (ADR 0036). */
export const SETTINGS_ITEMS: readonly SettingsItem[] = [
  { href: ROUTES.settingsTypes, key: "types", icon: ShapesIcon, permission: "configuration:view" },
  { href: ROUTES.settingsLists, key: "lists", icon: ListIcon, permission: "configuration:view" },
  {
    href: ROUTES.settingsSetups,
    key: "setups",
    icon: LayoutGridIcon,
    permission: "configuration:view",
  },
  {
    href: ROUTES.settingsResponsibilities,
    key: "responsibilities",
    icon: UserCheckIcon,
    permission: "responsibility:view",
  },
  {
    href: ROUTES.settingsSheets,
    key: "sheets",
    icon: ClipboardListIcon,
    permission: "template:view",
  },
  {
    href: ROUTES.settingsPriceLists,
    key: "priceLists",
    icon: TagIcon,
    permission: "priceList:view",
  },
  {
    href: ROUTES.settingsPipeline,
    key: "ticketPhases",
    icon: CircleDotIcon,
    permission: "pipeline:view",
  },
  {
    href: ROUTES.settingsItemStates,
    key: "itemStates",
    icon: ListChecksIcon,
    permission: "pipeline:view",
  },
  {
    href: ROUTES.settingsTicketTemplates,
    key: "ticketTemplates",
    icon: CopyPlusIcon,
    permission: "template:view",
  },
  { href: ROUTES.settingsMembers, key: "members", icon: UsersIcon, permission: "member:view" },
  {
    href: ROUTES.settingsPayments,
    key: "payments",
    icon: CreditCardIcon,
    permission: "paymentAccount:view",
  },
  {
    href: ROUTES.settingsIntegrations,
    key: "integrations",
    icon: PlugIcon,
    permission: "apiKey:view",
  },
  { href: ROUTES.skills, key: "skills", icon: BookOpenIcon, permission: null },
];

export type VisibleSettingsInput = { permissions: PermissionSet };

/** The settings pages the caller may open, by their view permission. */
export function visibleSettings({ permissions }: VisibleSettingsInput): SettingsItem[] {
  return SETTINGS_ITEMS.filter(
    ({ permission }) => permission === null || canPermission({ permissions, permission }),
  );
}

/** Whether the caller may see any configuration page (the sidebar entry and `/settings`). */
export function canOpenSettings({ permissions }: VisibleSettingsInput): boolean {
  return visibleSettings({ permissions }).some(({ permission }) => permission !== null);
}
