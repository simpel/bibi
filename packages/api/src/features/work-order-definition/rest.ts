import { restRoute } from "../../rest-route";

export const workOrderDefinitionRoutes = [
  restRoute({
    operation: "workOrderDefinition.list",
    method: "GET",
    path: "/work-order-definitions",
  }),
  restRoute({
    operation: "workOrderDefinition.get",
    method: "GET",
    path: "/work-order-definitions/{id}",
  }),
  restRoute({
    operation: "workOrderDefinition.create",
    method: "POST",
    path: "/work-order-definitions",
  }),
  restRoute({
    operation: "workOrderDefinition.update",
    method: "PATCH",
    path: "/work-order-definitions/{id}",
  }),
  restRoute({
    operation: "workOrderDefinition.archive",
    method: "DELETE",
    path: "/work-order-definitions/{id}",
  }),
];
