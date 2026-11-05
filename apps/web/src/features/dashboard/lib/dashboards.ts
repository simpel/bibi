import { ROUTES } from "@/lib/routes";

/** The dashboards in order of display: Forecast first, then Financial Results, then Workload. */
export const DASHBOARDS = ["forecast", "financials", "workload"] as const;

export type DashboardKey = (typeof DASHBOARDS)[number];

/** The dashboard a path segment names, or null for an unknown one. */
export const dashboardOf = ({ value }: { value: string | undefined }): DashboardKey | null =>
  DASHBOARDS.find((dashboard) => dashboard === value) ?? null;

/** `/data/{dashboard}`: the base the range is appended to. */
export const dashboardBase = ({ dashboard }: { dashboard: DashboardKey }): string => {
  if (dashboard === "forecast") return ROUTES.forecast;
  if (dashboard === "financials") return ROUTES.financials;
  return ROUTES.workload;
};
