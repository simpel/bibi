import type { Permission, PermissionSet } from "@bibi/core";
import {
  BookOpenIcon,
  Building2Icon,
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
  | "organization"
  | "types"
  | "lists"
  | "setups"
  | "responsibilities"
  | "sheets"
  | "priceLists"
  | "ticketStatuses"
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
  {
    href: ROUTES.settingsOrganization,
    key: "organization",
    icon: Building2Icon,
    permission: "configuration:read",
  },
  { href: ROUTES.settingsTypes, key: "types", icon: ShapesIcon, permission: "configuration:read" },
  { href: ROUTES.settingsLists, key: "lists", icon: ListIcon, permission: "configuration:read" },
  {
    href: ROUTES.settingsSetups,
    key: "setups",
    icon: LayoutGridIcon,
    permission: "configuration:read",
  },
  {
    href: ROUTES.settingsResponsibilities,
    key: "responsibilities",
    icon: UserCheckIcon,
    permission: "responsibility:read",
  },
  {
    href: ROUTES.settingsSheets,
    key: "sheets",
    icon: ClipboardListIcon,
    permission: "template:read",
  },
  {
    href: ROUTES.settingsPriceLists,
    key: "priceLists",
    icon: TagIcon,
    permission: "priceList:read",
  },
  {
    href: ROUTES.settingsPipeline,
    key: "ticketStatuses",
    icon: CircleDotIcon,
    permission: "pipeline:read",
  },
  {
    href: ROUTES.settingsItemStates,
    key: "itemStates",
    icon: ListChecksIcon,
    permission: "pipeline:read",
  },
  {
    href: ROUTES.settingsTicketTemplates,
    key: "ticketTemplates",
    icon: CopyPlusIcon,
    permission: "template:read",
  },
  { href: ROUTES.settingsMembers, key: "members", icon: UsersIcon, permission: "member:read" },
  {
    href: ROUTES.settingsPayments,
    key: "payments",
    icon: CreditCardIcon,
    permission: "paymentAccount:read",
  },
  {
    href: ROUTES.settingsIntegrations,
    key: "integrations",
    icon: PlugIcon,
    permission: "apiKey:read",
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
