import { restRoute } from "../../rest-route";

export const fieldDefinitionRoutes = [
  restRoute({ operation: "fieldDefinition.list", method: "GET", path: "/field-definitions" }),
  restRoute({
    operation: "fieldDefinition.list",
    method: "GET",
    path: "/entity-types/{entityTypeId}/fields",
    operationId: "fieldDefinitionListByEntityType",
  }),
  restRoute({ operation: "fieldDefinition.get", method: "GET", path: "/field-definitions/{id}" }),
  restRoute({
    operation: "fieldDefinition.create",
    method: "POST",
    path: "/entity-types/{entityTypeId}/fields",
  }),
  restRoute({
    operation: "fieldDefinition.update",
    method: "PATCH",
    path: "/field-definitions/{id}",
  }),
  restRoute({
    operation: "fieldDefinition.archive",
    method: "DELETE",
    path: "/field-definitions/{id}",
  }),
];
