import type { EntityTypeDto, Permission } from "@bibi/core";
import { canPermission } from "@/lib/can";
import type { CallerAbilities } from "@/server/caller-abilities";
import { hasCapability } from "./ui/has-capability";

/** The item page's tabs, in order; each is its own URL (`?tab=`), like the order page's. */
export const ITEM_TABS = [
  "details",
  "layouts",
  "bookings",
  "contents",
  "resources",
  "hours",
] as const;

export type ItemTab = (typeof ITEM_TABS)[number];

type AvailableInput = { type: EntityTypeDto | undefined; abilities: CallerAbilities };

/**
 * The tabs this item has: by its type's capabilities (Layouts for SETUPS, Bookings for
 * BOOKABLE, Contents for BUNDLE or CUSTOMISATIONS) and the caller's access (Bookings need
 * `order:read`). Details (opened first), resources and working hours are every item's.
 */
export function availableItemTabs({ type, abilities }: AvailableInput): ItemTab[] {
  const allowed = ({ permission }: { permission: Permission }) =>
    canPermission({ permissions: abilities.permissions, permission });
  const shown: Record<ItemTab, boolean> = {
    details: true,
    layouts: hasCapability({ type, capability: "SETUPS" }),
    bookings:
      hasCapability({ type, capability: "BOOKABLE" }) && allowed({ permission: "order:read" }),
    contents:
      hasCapability({ type, capability: "BUNDLE" }) ||
      hasCapability({ type, capability: "CUSTOMISATIONS" }),
    resources: true,
    hours: true,
  };
  return ITEM_TABS.filter((tab) => shown[tab]);
}

export type PickItemTabInput = { value: string | undefined; available: readonly ItemTab[] };

/** The tab the URL names when the item has it, else its first. */
export function pickItemTab({ value, available }: PickItemTabInput): ItemTab {
  return available.find((tab) => tab === value) ?? available[0] ?? "details";
}
