import type { Permission } from "@bibi/core";
import { canPermission } from "@/lib/can";
import type { CallerAbilities } from "@/server/caller-abilities";

/** The order page's tabs, in order; each is its own URL (`?tab=`), so the URL is the state. */
export const ORDER_TABS = ["program", "run-sheets", "money", "activity"] as const;

export type OrderTab = (typeof ORDER_TABS)[number];

/** The tab the order page's comments live in: a `#comments` link opens it. */
export const COMMENTS_TAB: OrderTab = "activity";

type AvailableInput = { abilities: CallerAbilities };

/**
 * The tabs the caller can see: a tab whose every section belongs to a feature they may not read is
 * left out (ADR 0050). Money and Activity always show: their estimate and status histories are
 * the order's own.
 */
export function availableOrderTabs({ abilities }: AvailableInput): OrderTab[] {
  // `canPermission`, not the server's `can`: a client component reads this file's constants.
  const allowed = ({ permission }: { permission: Permission }) =>
    canPermission({ permissions: abilities.permissions, permission });
  const shown: Record<OrderTab, boolean> = {
    program: allowed({ permission: "program:read" }),
    "run-sheets": allowed({ permission: "runSheet:read" }),
    // The estimate history is the order's own, so Money always has something to show.
    money: true,
    activity: true,
  };
  return ORDER_TABS.filter((tab) => shown[tab]);
}

export type PickOrderTabInput = { value: string | undefined; available: readonly OrderTab[] };

/** The tab the URL names when the caller can see it, else the first they can. */
export function pickOrderTab({ value, available }: PickOrderTabInput): OrderTab {
  const named = available.find((tab) => tab === value);
  return named ?? available[0] ?? "activity";
}
