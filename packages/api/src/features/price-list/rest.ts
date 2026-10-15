import { restRoute } from "../../rest-route";

export const priceListRoutes = [
  restRoute({ operation: "priceList.list", method: "GET", path: "/price-lists" }),
  restRoute({ operation: "priceList.get", method: "GET", path: "/price-lists/{id}" }),
  restRoute({ operation: "priceList.create", method: "POST", path: "/price-lists" }),
  restRoute({ operation: "priceList.update", method: "PATCH", path: "/price-lists/{id}" }),
  restRoute({ operation: "priceList.setItems", method: "PUT", path: "/price-lists/{id}/items" }),
  restRoute({ operation: "priceList.archive", method: "DELETE", path: "/price-lists/{id}" }),
];
