import { restRoute } from "../../rest-route";

export const quoteRoutes = [
  restRoute({ operation: "quote.list", method: "GET", path: "/quotes" }),
  restRoute({ operation: "quote.get", method: "GET", path: "/quotes/{id}" }),
  restRoute({ operation: "quote.create", method: "POST", path: "/quotes" }),
  restRoute({ operation: "quote.update", method: "PATCH", path: "/quotes/{id}" }),
  restRoute({ operation: "quote.revise", method: "POST", path: "/quotes/{id}/versions" }),
  restRoute({ operation: "quote.send", method: "POST", path: "/quotes/{id}/send" }),
  restRoute({ operation: "quote.accept", method: "POST", path: "/quotes/{id}/accept" }),
  restRoute({ operation: "quote.decline", method: "POST", path: "/quotes/{id}/decline" }),
  restRoute({ operation: "quote.expire", method: "POST", path: "/quotes/{id}/expire" }),
];
