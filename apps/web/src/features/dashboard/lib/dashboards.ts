import { ROUTES } from "@/lib/routes";

/** The dashboards (ADR 0086), in the order the header shows them. */
export const DASHBOARDS = ["financials", "workload"] as const;

export type DashboardKey = (typeof DASHBOARDS)[number];

/** The dashboard a path segment names, or null for an unknown one. */
export const dashboardOf = ({ value }: { value: string | undefined }): DashboardKey | null =>
  DASHBOARDS.find((dashboard) => dashboard === value) ?? null;

/** `/data/{dashboard}`: the base the range is appended to. */
export const dashboardBase = ({ dashboard }: { dashboard: DashboardKey }) =>
  dashboard === "financials" ? ROUTES.financials : ROUTES.workload;
