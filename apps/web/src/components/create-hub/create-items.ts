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
import type { CallerAbilities } from "@/server/caller-abilities";

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
    ability: "ticketWrite",
  },
  {
    key: "customer",
    group: "work",
    href: ROUTES.customerNew,
    icon: UsersIcon,
    ability: "customerWrite",
  },
  { key: "item", group: "catalog", href: ROUTES.itemNew, icon: BoxIcon, ability: "itemWrite" },
  {
    key: "venue",
    group: "catalog",
    href: ROUTES.venueNew,
    icon: BuildingIcon,
    ability: null,
  },
  {
    key: "priceList",
    group: "catalog",
    href: ROUTES.priceListNew,
    icon: TagIcon,
    ability: "priceListWrite",
  },
  {
    key: "skill",
    group: "settings",
    href: ROUTES.skillNew,
    icon: BookOpenIcon,
    ability: "skillAdmin",
  },
  {
    key: "type",
    group: "settings",
    href: ROUTES.typeNew,
    icon: ShapesIcon,
    ability: "configurationWrite",
  },
  {
    key: "list",
    group: "settings",
    href: ROUTES.settingsLists,
    icon: ListIcon,
    ability: "configurationWrite",
  },
  {
    key: "setup",
    group: "settings",
    href: ROUTES.settingsSetups,
    icon: LayoutGridIcon,
    ability: "configurationWrite",
  },
  {
    key: "responsibility",
    group: "settings",
    href: ROUTES.responsibilityNew,
    icon: UserCheckIcon,
    ability: "configurationWrite",
  },
  {
    key: "sheet",
    group: "settings",
    href: ROUTES.sheetNew,
    icon: ClipboardListIcon,
    ability: "configurationWrite",
  },
  {
    key: "ticketPhase",
    group: "settings",
    href: ROUTES.settingsPipeline,
    icon: CircleDotIcon,
    ability: "ticketPhaseAdmin",
  },
  {
    key: "member",
    group: "settings",
    href: ROUTES.settingsMembers,
    icon: UserPlusIcon,
    ability: "memberAdmin",
  },
];

export type CreatableInput = { abilities: CallerAbilities };

/** What the caller's role allows to create. */
export function creatableItems({ abilities }: CreatableInput): CreateItem[] {
  return CREATE_ITEMS.filter(({ ability }) => ability === null || abilities[ability] === true);
}
