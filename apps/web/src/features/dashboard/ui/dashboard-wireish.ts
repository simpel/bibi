import type { DashboardSummary } from "@bibi/core/schemas";

type Dated<T, K extends keyof T> = Omit<T, K> & { [P in K]: Date | string };
type Attention = DashboardSummary["attention"];

/**
 * The summary as the page has it (dates) or as a tool result carries it (ISO strings), so the
 * page and the assistant's card share the panels.
 */
export type DashboardWireish = Omit<DashboardSummary, "attention" | "scheduled"> & {
  attention: Omit<Attention, "expiringHolds" | "unsentWorkOrders"> & {
    expiringHolds: Dated<Attention["expiringHolds"][number], "holdsUntil">[];
    unsentWorkOrders:
      | Dated<NonNullable<Attention["unsentWorkOrders"]>[number], "startsAt">[]
      | null;
  };
  scheduled: Dated<DashboardSummary["scheduled"][number], "startsAt">[];
};
