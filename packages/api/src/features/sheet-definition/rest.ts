import { restRoute } from "../../rest-route";

export const sheetDefinitionRoutes = [
  restRoute({ operation: "sheetDefinition.list", method: "GET", path: "/sheet-definitions" }),
  restRoute({ operation: "sheetDefinition.get", method: "GET", path: "/sheet-definitions/{id}" }),
  restRoute({ operation: "sheetDefinition.create", method: "POST", path: "/sheet-definitions" }),
  restRoute({
    operation: "sheetDefinition.update",
    method: "PATCH",
    path: "/sheet-definitions/{id}",
  }),
  restRoute({
    operation: "sheetDefinition.archive",
    method: "DELETE",
    path: "/sheet-definitions/{id}",
  }),
];
