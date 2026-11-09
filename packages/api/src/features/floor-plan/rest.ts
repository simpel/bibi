import { restRoute } from "../../rest-route";

export const floorPlanRoutes = [
  restRoute({ operation: "floorElementKind.list", method: "GET", path: "/floor-element-kinds" }),
  restRoute({
    operation: "floorElementKind.get",
    method: "GET",
    path: "/floor-element-kinds/{id}",
  }),
  restRoute({ operation: "floorElementKind.create", method: "POST", path: "/floor-element-kinds" }),
  restRoute({
    operation: "floorElementKind.update",
    method: "PATCH",
    path: "/floor-element-kinds/{id}",
  }),
  restRoute({
    operation: "floorElementKind.archive",
    method: "DELETE",
    path: "/floor-element-kinds/{id}",
  }),
  restRoute({
    operation: "floorElementKind.importTemplate",
    method: "POST",
    path: "/floor-element-kinds/import",
  }),
  restRoute({ operation: "floorPlan.get", method: "GET", path: "/items/{itemId}/floor-plan" }),
  restRoute({ operation: "floorPlan.save", method: "PUT", path: "/items/{itemId}/floor-plan" }),
  restRoute({
    operation: "setupLayout.get",
    method: "GET",
    path: "/items/{itemId}/layouts/{setupId}",
  }),
  restRoute({
    operation: "setupLayout.save",
    method: "PUT",
    path: "/items/{itemId}/layouts/{setupId}",
  }),
];
