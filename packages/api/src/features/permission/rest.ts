import { restRoute } from "../../rest-route";

export const permissionRoutes = [
  restRoute({
    operation: "permission.get",
    method: "GET",
    path: "/permissions/{subjectType}/{subjectId}",
  }),
  restRoute({
    operation: "permission.update",
    method: "PUT",
    path: "/permissions/{subjectType}/{subjectId}",
  }),
];
