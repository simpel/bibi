import { restRoute } from "../../rest-route";

export const commentRoutes = [
  restRoute({ operation: "comment.list", method: "GET", path: "/orders/{orderId}/comments" }),
  restRoute({ operation: "comment.get", method: "GET", path: "/comments/{id}" }),
  restRoute({ operation: "comment.create", method: "POST", path: "/comments" }),
  restRoute({ operation: "comment.update", method: "PATCH", path: "/comments/{id}" }),
  restRoute({ operation: "comment.archive", method: "DELETE", path: "/comments/{id}" }),
];
