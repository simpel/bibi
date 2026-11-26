import { restRoute } from "../../rest-route";

export const tableCombinationRoutes = [
  restRoute({
    operation: "tableCombination.list",
    method: "GET",
    path: "/layouts/{layoutId}/table-combinations",
  }),
  restRoute({
    operation: "tableCombination.save",
    method: "PUT",
    path: "/layouts/{layoutId}/table-combinations",
  }),
];
