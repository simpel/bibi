import type { PermissionSet } from "@bibi/core";
import {
  BookOpenIcon,
  BoxIcon,
  BuildingIcon,
  CalendarCheckIcon,
  CircleCheckIcon,
  CircleDotIcon,
  ClipboardListIcon,
  CopyPlusIcon,
  ListIcon,
  ShapesIcon,
  TagIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";
import { canPermission } from "@/lib/can";
import { ROUTES } from "@/lib/routes";

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
    key: "task",
    group: "work",
    href: ROUTES.taskNew,
    icon: CircleCheckIcon,
    permission: "task:write",
  },
  {
    key: "reservation",
    group: "work",
    // The day view opens its create sheet (ADR 0119).
    href: `${ROUTES.reservations}?create=1`,
    icon: UtensilsIcon,
    permission: "reservation:write",
    requires: "diningRoom",
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
    key: "package",
    group: "catalog",
    href: ROUTES.orderTemplateNew,
    icon: CopyPlusIcon,
    permission: "orderTemplate:write",
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

export type CreatableInput = {
  permissions: PermissionSet;
  /** The organization has a dining room: table reservations can be created. */
  hasDiningRooms?: boolean;
};

/** What the caller's permissions allow to create. Pure, so the top bar's menu uses it too. */
export function creatableItems({
  permissions,
  hasDiningRooms = false,
}: CreatableInput): CreateItem[] {
  return CREATE_ITEMS.filter(
    ({ permission, requires }) =>
      canPermission({ permissions, permission }) && (requires !== "diningRoom" || hasDiningRooms),
  );
}
