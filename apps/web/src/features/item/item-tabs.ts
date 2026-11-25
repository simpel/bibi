import type { EntityTypeDto, Permission } from "@bibi/core";
import { canPermission } from "@/lib/can";
import type { CallerAbilities } from "@/server/caller-abilities";
import { hasCapability } from "./ui/has-capability";

/** The item page's tabs, in order; each is its own URL (`?tab=`), like the order page's. */
export const ITEM_TABS = [
  "details",
  "layouts",
  "occupancy",
  "contents",
  "resources",
  "hours",
  "history",
] as const;

export type ItemTab = (typeof ITEM_TABS)[number];

type AvailableInput = { type: EntityTypeDto | undefined; abilities: CallerAbilities };

/**
 * The tabs this item has: by its type's capabilities (Layouts for SETUPS, Occupancy for
 * BOOKABLE, Contents for BUNDLE or CUSTOMISATIONS) and the caller's access (Occupancy needs
 * `order:read`). Hours are for BOOKABLE
 * items only (bookings outside them warn). Details (opened first) and resources are every item's;
 * History, last, needs `audit:read`.
 */
export function availableItemTabs({ type, abilities }: AvailableInput): ItemTab[] {
  const allowed = ({ permission }: { permission: Permission }) =>
    canPermission({ permissions: abilities.permissions, permission });
  const shown: Record<ItemTab, boolean> = {
    details: true,
    layouts: hasCapability({ type, capability: "SETUPS" }),
    occupancy:
      hasCapability({ type, capability: "BOOKABLE" }) && allowed({ permission: "order:read" }),
    contents:
      hasCapability({ type, capability: "BUNDLE" }) ||
      hasCapability({ type, capability: "CUSTOMISATIONS" }),
    resources: true,
    hours: hasCapability({ type, capability: "BOOKABLE" }),
    history: allowed({ permission: "audit:read" }),
  };
  return ITEM_TABS.filter((tab) => shown[tab]);
}

/** Which word the hours tab uses: a person keeps working hours, anything else opening hours. */
export type HoursKind = "PERSON" | "other";

export function hoursKind({ type }: { type: EntityTypeDto | undefined }): HoursKind {
  return type?.resourceKind === "PERSON" ? "PERSON" : "other";
}

export type PickItemTabInput = { value: string | undefined; available: readonly ItemTab[] };

/** The tab the URL names when the item has it, else its first. */
export function pickItemTab({ value, available }: PickItemTabInput): ItemTab {
  return available.find((tab) => tab === value) ?? available[0] ?? "details";
}
