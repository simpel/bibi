import type { Permission } from "@bibi/core";
import { canPermission } from "@/lib/can";
import type { CallerAbilities } from "@/server/caller-abilities";

/** The order page's tabs, in order; each is its own URL (`?tab=`), so the URL is the state. */
export const ORDER_TABS = [
  "program",
  "customer",
  "tasks",
  "run-sheets",
  "money",
  "details",
  "comments",
  "messages",
  "activity",
] as const;

export type OrderTab = (typeof ORDER_TABS)[number];

/** The tab the order page's comments live in: a `#comments` link opens it. */
export const COMMENTS_TAB: OrderTab = "comments";

type AvailableInput = { abilities: CallerAbilities };

/**
 * The tabs the caller can see: a tab whose every section belongs to a feature they may not read is
 * left out (ADR 0050). Money, Messages and Activity always show: the estimate history, the reply
 * address and the status history are the order's own.
 */
export function availableOrderTabs({ abilities }: AvailableInput): OrderTab[] {
  // `canPermission`, not the server's `can`: a client component reads this file's constants.
  const allowed = ({ permission }: { permission: Permission }) =>
    canPermission({ permissions: abilities.permissions, permission });
  const shown: Record<OrderTab, boolean> = {
    program: allowed({ permission: "program:read" }),
    // The order's own customer and contact, as names, even without customer:read.
    customer: true,
    // Site visits, tastings and deadlines linked to the order (ADR 0117).
    tasks: allowed({ permission: "task:read" }),
    "run-sheets": allowed({ permission: "runSheet:read" }),
    // The estimate history is the order's own, so Money always has something to show.
    money: true,
    // The order's own type, money, fields and note, and who works it.
    details: true,
    comments: allowed({ permission: "comment:read" }),
    // The order's own reply address shows even before any message arrives.
    messages: true,
    // The status history is the order's own.
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
