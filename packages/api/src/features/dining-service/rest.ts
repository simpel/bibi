import { restRoute } from "../../rest-route";

export const diningServiceRoutes = [
  restRoute({ operation: "diningService.list", method: "GET", path: "/dining-services" }),
  restRoute({ operation: "diningService.get", method: "GET", path: "/dining-services/{id}" }),
  restRoute({ operation: "diningService.create", method: "POST", path: "/dining-services" }),
  restRoute({ operation: "diningService.update", method: "PATCH", path: "/dining-services/{id}" }),
  restRoute({
    operation: "diningService.archive",
    method: "DELETE",
    path: "/dining-services/{id}",
  }),
  restRoute({
    operation: "diningServiceException.list",
    method: "GET",
    path: "/dining-services/{serviceId}/exceptions",
  }),
  restRoute({
    operation: "diningServiceException.set",
    method: "PUT",
    path: "/dining-services/{serviceId}/exceptions/{date}",
  }),
  restRoute({
    operation: "diningServiceException.delete",
    method: "DELETE",
    path: "/dining-services/{serviceId}/exceptions/{date}",
  }),
];
