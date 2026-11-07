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
 * until they get their own page. Quotes, occupancies, options and lines are created
 * from the order or item they belong to, so they are not listed.
 */
export const CREATE_ITEMS: readonly CreateItem[] = [
  {
    key: "order",
    group: "work",
    href: ROUTES.orderNew,
    icon: CalendarCheckIcon,
    permission: "order:write",
  },
  {
    key: "customer",
    group: "work",
    href: ROUTES.customerNew,
    icon: UsersIcon,
    permission: "customer:write",
  },
  { key: "item", group: "catalog", href: ROUTES.itemNew, icon: BoxIcon, permission: "item:write" },
  {
    key: "venue",
    group: "catalog",
    href: ROUTES.venueNew,
    icon: BuildingIcon,
    permission: "venue:write",
  },
  {
    key: "priceList",
    group: "catalog",
    href: ROUTES.priceListNew,
    icon: TagIcon,
    permission: "priceList:write",
  },
  {
    key: "skill",
    group: "settings",
    href: ROUTES.skillNew,
    icon: BookOpenIcon,
    permission: "assistant:write",
  },
  {
    key: "type",
    group: "settings",
    href: ROUTES.typeNew,
    icon: ShapesIcon,
    permission: "configuration:write",
  },
  {
    key: "list",
    group: "settings",
    href: ROUTES.adminLists,
    icon: ListIcon,
    permission: "configuration:write",
  },
  {
    key: "setup",
    group: "settings",
    href: ROUTES.adminSetups,
    icon: LayoutGridIcon,
    permission: "configuration:write",
  },
  {
    key: "responsibility",
    group: "settings",
    href: ROUTES.responsibilityNew,
    icon: UserCheckIcon,
    permission: "responsibility:write",
  },
  {
    key: "runSheet",
    group: "settings",
    href: ROUTES.runSheetNew,
    icon: ClipboardListIcon,
    permission: "template:write",
  },
  {
    key: "orderStatus",
    group: "settings",
    href: ROUTES.adminPipeline,
    icon: CircleDotIcon,
    permission: "pipeline:write",
  },
  {
    key: "member",
    group: "settings",
    href: ROUTES.adminMembers,
    icon: UserPlusIcon,
    permission: "member:write",
  },
];

export type CreatableInput = { abilities: CallerAbilities };

/** What the caller's permissions allow to create. */
export function creatableItems({ abilities }: CreatableInput): CreateItem[] {
  return CREATE_ITEMS.filter(({ permission }) => can({ abilities, permission }));
}
