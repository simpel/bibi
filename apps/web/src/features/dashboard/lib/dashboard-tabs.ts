import { ROUTES } from "@/lib/routes";

/** The dashboard's tabs (ADR 0086), in the order they show. */
export const DASHBOARD_TABS = ["financials", "workload"] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number];

/** The tab a path segment names, or null for an unknown one. */
export const dashboardTabOf = ({ value }: { value: string }): DashboardTab | null =>
  DASHBOARD_TABS.find((tab) => tab === value) ?? null;

/** `/dashboard/{tab}`: the base the range is appended to. */
export const tabBase = ({ tab }: { tab: DashboardTab }) =>
  tab === "financials" ? ROUTES.financials : ROUTES.workload;
