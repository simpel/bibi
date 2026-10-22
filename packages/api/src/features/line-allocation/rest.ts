import { restRoute } from "../../rest-route";

export const lineAllocationRoutes = [
  restRoute({
    operation: "lineAllocation.list",
    method: "GET",
    path: "/lines/{lineId}/allocations",
  }),
  restRoute({ operation: "lineAllocation.get", method: "GET", path: "/line-allocations/{id}" }),
  restRoute({
    operation: "lineAllocation.assign",
    method: "PUT",
    path: "/line-allocations/{id}/unit",
  }),
];
