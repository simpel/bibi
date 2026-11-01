import type { DashboardSummary } from "@bibi/core/schemas";

type Dated<T, K extends keyof T> = Omit<T, K> & { [P in K]: Date | string };
type Attention = DashboardSummary["attention"];

/**
 * The summary as the page has it (dates) or as a tool result carries it (ISO strings), so the
 * page and the assistant's card share the panels.
 */
export type DashboardWireish = Omit<DashboardSummary, "attention" | "comingUp"> & {
  attention: Omit<Attention, "expiringHolds" | "unsentSheets"> & {
    expiringHolds: Dated<Attention["expiringHolds"][number], "holdsUntil">[];
    unsentSheets: Dated<NonNullable<Attention["unsentSheets"]>[number], "startsAt">[] | null;
  };
  comingUp: Dated<DashboardSummary["comingUp"][number], "startsAt">[];
};
