import {
  BookOpenIcon,
  BoxIcon,
  BuildingIcon,
  CalendarCheckIcon,
  CircleDotIcon,
  ClipboardListIcon,
  LayoutGridIcon,
  ListIcon,
  ShapesIcon,
  TagIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { type CallerAbilities, can } from "@/server/caller-abilities";

import type { CreateItem } from "./create-item-types";

/**
 * Everything a member can create, one card each on `/new`. A thing with a step-by-step page
 * links to `/new/<thing>`; the others open their list with the create dialog (`?create=1`)
 * until they get their own page. Quotes, occupancies, options and program items are created
 * from the ticket or item they belong to, so they are not listed.
 */
export const CREATE_ITEMS: readonly CreateItem[] = [
  {
    key: "ticket",
    group: "work",
    href: ROUTES.ticketNew,
    icon: CalendarCheckIcon,
    permission: "ticket:create",
  },
  {
    key: "customer",
    group: "work",
    href: ROUTES.customerNew,
    icon: UsersIcon,
    permission: "customer:create",
  },
  { key: "item", group: "catalog", href: ROUTES.itemNew, icon: BoxIcon, permission: "item:create" },
  {
    key: "venue",
    group: "catalog",
    href: ROUTES.venueNew,
    icon: BuildingIcon,
    permission: "venue:create",
  },
  {
    key: "priceList",
    group: "catalog",
    href: ROUTES.priceListNew,
    icon: TagIcon,
    permission: "priceList:create",
  },
  {
    key: "skill",
    group: "settings",
    href: ROUTES.skillNew,
    icon: BookOpenIcon,
    permission: "assistant:edit",
  },
  {
    key: "type",
    group: "settings",
    href: ROUTES.typeNew,
    icon: ShapesIcon,
    permission: "configuration:create",
  },
  {
    key: "list",
    group: "settings",
    href: ROUTES.settingsLists,
    icon: ListIcon,
    permission: "configuration:create",
  },
  {
    key: "setup",
    group: "settings",
    href: ROUTES.settingsSetups,
    icon: LayoutGridIcon,
    permission: "configuration:create",
  },
  {
    key: "responsibility",
    group: "settings",
    href: ROUTES.responsibilityNew,
    icon: UserCheckIcon,
    permission: "responsibility:create",
  },
  {
    key: "sheet",
    group: "settings",
    href: ROUTES.sheetNew,
    icon: ClipboardListIcon,
    permission: "template:create",
  },
  {
    key: "ticketPhase",
    group: "settings",
    href: ROUTES.settingsPipeline,
    icon: CircleDotIcon,
    permission: "pipeline:create",
  },
  {
    key: "member",
    group: "settings",
    href: ROUTES.settingsMembers,
    icon: UserPlusIcon,
    permission: "member:create",
  },
];

export type CreatableInput = { abilities: CallerAbilities };

/** What the caller's permissions allow to create. */
export function creatableItems({ abilities }: CreatableInput): CreateItem[] {
  return CREATE_ITEMS.filter(({ permission }) => can({ abilities, permission }));
}
