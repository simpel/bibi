import { restRoute } from "../../rest-route";

export const runSheetDefinitionRoutes = [
  restRoute({
    operation: "runSheetDefinition.list",
    method: "GET",
    path: "/run-sheet-definitions",
  }),
  restRoute({
    operation: "runSheetDefinition.get",
    method: "GET",
    path: "/run-sheet-definitions/{id}",
  }),
  restRoute({
    operation: "runSheetDefinition.create",
    method: "POST",
    path: "/run-sheet-definitions",
  }),
  restRoute({
    operation: "runSheetDefinition.update",
    method: "PATCH",
    path: "/run-sheet-definitions/{id}",
  }),
  restRoute({
    operation: "runSheetDefinition.archive",
    method: "DELETE",
    path: "/run-sheet-definitions/{id}",
  }),
];
