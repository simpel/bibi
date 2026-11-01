import { restRoute } from "../../rest-route";

export const dashboardRoutes = [
  restRoute({ operation: "dashboard.summary", method: "GET", path: "/dashboard/summary" }),
];
