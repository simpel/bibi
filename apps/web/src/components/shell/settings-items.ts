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

export type SettingsItem = { href: string; key: SettingsKey; icon: LucideIcon };

/** The configuration pages listed on the `/settings` hub (ADR 0036). */
export const SETTINGS_ITEMS: readonly SettingsItem[] = [
  { href: ROUTES.settingsTypes, key: "types", icon: ShapesIcon },
  { href: ROUTES.settingsLists, key: "lists", icon: ListIcon },
  { href: ROUTES.settingsSetups, key: "setups", icon: LayoutGridIcon },
  { href: ROUTES.settingsResponsibilities, key: "responsibilities", icon: UserCheckIcon },
  { href: ROUTES.settingsSheets, key: "sheets", icon: ClipboardListIcon },
  { href: ROUTES.settingsPriceLists, key: "priceLists", icon: TagIcon },
  { href: ROUTES.settingsPipeline, key: "ticketPhases", icon: CircleDotIcon },
  { href: ROUTES.settingsItemStates, key: "itemStates", icon: ListChecksIcon },
  { href: ROUTES.settingsTicketTemplates, key: "ticketTemplates", icon: CopyPlusIcon },
  { href: ROUTES.settingsMembers, key: "members", icon: UsersIcon },
  { href: ROUTES.settingsPayments, key: "payments", icon: CreditCardIcon },
  { href: ROUTES.settingsIntegrations, key: "integrations", icon: PlugIcon },
  { href: ROUTES.skills, key: "skills", icon: BookOpenIcon },
];
